"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { isAbortError } from "@/lib/http";
import { money } from "@/lib/range";
import { dayKey, parseDayKey } from "@/lib/bookingSlots";
import { errorMessage, type RequestStatus } from "@/lib/requestStatus";
import { mapPlatformResponse, type PlatformApiResponse } from "@/lib/platformApi";
import type {
  Booking,
  Category,
  Dish,
  Order,
  OrderLine,
  Settings,
  SpecialTax,
  TableRec,
  Workspace,
} from "@/lib/types";
import { LEXICON } from "@/lib/lexicon";
import { t } from "@/lib/i18n";
import { usePlatformSocket } from "@/hooks/usePlatformSocket";
import { isNewer, removeById, upsertById } from "@/lib/liveMerge";

interface WorkspaceContextValue {
  workspace: Workspace;
  /** True once the initial load has settled (successfully or not). */
  hydrated: boolean;
  /** Initial workspace load: idle when signed out, then loading → success | error. */
  status: RequestStatus;
  error: string | null;
  /** Re-runs the initial workspace load (e.g. after an error), showing the loading state. */
  reload: () => void;
  /** Reloads the workspace in the background: the current data stays on screen
   * until the new data arrives, and a failure only shows a toast. */
  refresh: () => void;
  flow: string[];
  currency: string;
  fmt: (value: number) => string;
  refreshOrders: () => Promise<void>;
  saveTable: (
    table: Omit<TableRec, "id" | "state" | "seatedAt"> & { id?: string },
  ) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  /** Resolves with the saved category (a new one's id comes from the backend). */
  saveCategory: (category: Omit<Category, "id"> & { id?: string }) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  /** Saves the menu's category order (every category's id, first to last); shown at once, undone if the save fails. */
  reorderCategories: (ids: string[]) => Promise<void>;
  saveDish: (dish: Omit<Dish, "id"> & { id?: string }) => Promise<void>;
  deleteDish: (id: string) => Promise<void>;
  addOrder: (input: { tableName: string; itemId: string; qty: number }) => Promise<void>;
  placeOrder: (
    tableName: string,
    lines: { itemId: string; qty: number; note?: string }[],
  ) => Promise<Order>;
  advanceOrder: (id: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  setOrderLineQty: (orderId: string, itemId: string, qty: number) => Promise<void>;
  addOrderLine: (orderId: string, itemId: string) => Promise<void>;
  /** `date` ("YYYY-MM-DD") defaults to today. */
  saveBooking: (booking: Omit<Booking, "id" | "ts" | "date"> & { date?: string }) => Promise<void>;
  toggleBooking: (id: string) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  assignBooking: (bookingId: string, tableId: string) => Promise<void>;
  unassignBooking: (bookingId: string) => Promise<void>;
  seatTable: (id: string) => Promise<void>;
  checkoutTable: (id: string) => Promise<void>;
  freeTable: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  updateProfile: (patch: {
    name?: string;
    phone?: string;
    address?: string;
    logoUrl?: string;
  }) => Promise<void>;
  addSpecialTax: (tax: Omit<SpecialTax, "id">) => Promise<void>;
  removeSpecialTax: (id: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const EMPTY_WORKSPACE: Workspace = {
  id: null,
  name: "",
  domain: "restaurant",
  zones: [],
  tables: [],
  categories: [],
  dishes: [],
  orders: [],
  bookings: [],
  settings: { taxRate: 10, currency: "€", specialTaxes: [] },
};

// --- API row -> frontend type mappers (backend is snake_case, Decimal-as-string, Date objects) ---

interface ApiTable {
  id: string;
  name: string;
  seats: number;
  zone: string;
  state: string;
  seated_at: string | null;
}
const mapTable = (t: ApiTable): TableRec => ({
  id: t.id,
  name: t.name,
  seats: t.seats,
  zone: t.zone,
  state: t.state as TableRec["state"],
  seatedAt: t.seated_at ? new Date(t.seated_at).getTime() : null,
});

interface ApiCategory {
  id: string;
  name: string;
  is_active: boolean;
}
const mapCategory = (c: ApiCategory): Category => ({ id: c.id, name: c.name, valid: c.is_active });

interface ApiDish {
  id: string;
  name: string;
  price: string | number;
  category_id: string | null;
  description: string | null;
  tax_mode: string;
  tax_name: string | null;
  tax_pct: string | number | null;
  status: Dish["status"];
  is_vegan: boolean;
  image_url: string | null;
  sold_count: number;
}
const mapDish = (d: ApiDish): Dish => ({
  id: d.id,
  name: d.name,
  price: Number(d.price),
  catId: d.category_id ?? "",
  status: d.status,
  taxMode: d.tax_mode as Dish["taxMode"],
  description: d.description ?? undefined,
  taxName: d.tax_name ?? undefined,
  taxPct: d.tax_pct !== null ? Number(d.tax_pct) : undefined,
  isVegan: d.is_vegan,
  imageUrl: d.image_url ?? undefined,
  soldCount: d.sold_count,
});

export interface ApiOrderLine {
  id: string;
  item_id: string;
  name: string;
  price: string | number;
  qty: number;
  note: string | null;
}
export interface ApiOrder {
  id: string;
  code: string;
  table_name: string;
  total: string | number;
  tax_rate: string | number;
  status: string;
  ts: string;
  closed_ts: string | null;
  session_id: string | null;
  order_lines: ApiOrderLine[];
}
const mapOrderLine = (l: ApiOrderLine): OrderLine => ({
  id: l.id,
  itemId: l.item_id,
  name: l.name,
  price: Number(l.price),
  qty: l.qty,
  note: l.note ?? undefined,
});
export const mapOrder = (o: ApiOrder): Order => ({
  id: o.id,
  code: o.code,
  tableName: o.table_name,
  lines: o.order_lines.map(mapOrderLine),
  total: Number(o.total),
  taxRate: Number(o.tax_rate),
  ts: new Date(o.ts).getTime(),
  status: o.status,
  closedTs: o.closed_ts ? new Date(o.closed_ts).getTime() : null,
  sessionId: o.session_id,
});

/** Every order (open + recent closed) and table, mapped: what a check-out can change. */
async function fetchOrdersAndTables(signal: AbortSignal): Promise<Pick<Workspace, "orders" | "tables">> {
  const [ordersRes, tablesRes] = await Promise.all([
    apiFetch<{ orders: ApiOrder[] }>("/orders", { signal }),
    apiFetch<{ tables: ApiTable[] }>("/tables", { signal }),
  ]);
  return { orders: ordersRes.orders.map(mapOrder), tables: tablesRes.tables.map(mapTable) };
}

interface ApiBooking {
  id: string;
  name: string;
  time: string;
  party: number;
  status: string;
  date: string;
  tables?: { name: string } | null;
}
const mapBooking = (b: ApiBooking, tableNameById: Map<string, string>, tableId?: string | null): Booking => {
  // The backend stores a calendar date (serialized as UTC midnight); keep the
  // date part as-is so a negative UTC offset can't move it to the day before.
  const date = b.date.slice(0, 10);
  return {
    id: b.id,
    name: b.name,
    time: b.time,
    party: b.party,
    tableName: tableId ? tableNameById.get(tableId) ?? null : null,
    status: b.status as Booking["status"],
    date,
    ts: parseDayKey(date).getTime(),
  };
};

interface ApiSpecialTax {
  id: string;
  name: string;
  pct: string | number;
}
const mapSpecialTax = (t: ApiSpecialTax): SpecialTax => ({ id: t.id, name: t.name, pct: Number(t.pct) });

interface ApiSettings {
  currency: string;
  taxRate: string | number;
  specialTaxes: ApiSpecialTax[];
}
const mapSettings = (s: ApiSettings): Settings => ({
  currency: s.currency,
  taxRate: Number(s.taxRate),
  specialTaxes: s.specialTaxes.map(mapSpecialTax),
});

// Bookings from the API carry table_id but not the table's name; resolve names client-side
// against the already-fetched tables list rather than adding a second backend join.
interface ApiBookingRaw extends ApiBooking {
  table_id: string | null;
}

async function fetchWorkspaceData(id: string, domain: "restaurant" | "cafe", name: string, contact: {
  phone?: string;
  email?: string;
  address?: string;
  logoUrl?: string;
}, signal?: AbortSignal): Promise<Workspace> {
  const [tablesRes, categoriesRes, dishesRes, ordersRes, bookingsRes, settingsRes] = await Promise.all([
    apiFetch<{ tables: ApiTable[] }>("/tables", { signal }),
    apiFetch<{ categories: ApiCategory[] }>("/categories", { signal }),
    apiFetch<{ dishes: ApiDish[] }>("/dishes", { signal }),
    apiFetch<{ orders: ApiOrder[] }>("/orders", { signal }),
    apiFetch<{ bookings: ApiBookingRaw[] }>("/bookings", { signal }),
    apiFetch<{ settings: ApiSettings }>("/settings", { signal }),
  ]);

  const tables = tablesRes.tables.map(mapTable);
  const tableNameById = new Map(tables.map((t) => [t.id, t.name]));
  const zones = Array.from(new Set(tables.map((t) => t.zone).filter(Boolean)));

  return {
    id,
    name,
    domain,
    phone: contact.phone,
    email: contact.email,
    address: contact.address,
    logoUrl: contact.logoUrl,
    zones,
    tables,
    categories: categoriesRes.categories.map(mapCategory),
    dishes: dishesRes.dishes.map(mapDish),
    orders: ordersRes.orders.map(mapOrder),
    bookings: bookingsRes.bookings.map((b) => mapBooking(b, tableNameById, b.table_id)),
    settings: mapSettings(settingsRes.settings),
  };
}

/**
 * Platform identity (name, domain, contact details) and all operational data
 * (tables, menu, orders, bookings, settings) are fetched from CRM_backend on
 * mount and mutated through it directly — nothing is persisted to localStorage.
 * Fetching client-side (rather than blocking the server-rendered document on
 * it) keeps the initial HTML response fast for every route, including public
 * pages that don't need workspace data at all.
 */
export function WorkspaceProvider({
  children,
  signedIn = false,
}: {
  children: ReactNode;
  /** Whether someone is signed in (the token itself stays on the server). */
  signedIn?: boolean;
}) {
  const [workspace, setWorkspace] = useState<Workspace>(EMPTY_WORKSPACE);
  const [status, setStatus] = useState<RequestStatus>(signedIn ? "loading" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // Set by refresh(): the next load keeps the current workspace on screen.
  const backgroundLoad = useRef(false);
  const hydrated = status === "success" || status === "error" || status === "idle";
  const queryClient = useQueryClient();

  // Order history/stats are cached reads (TanStack Query) — any change to the
  // live order list (a mutation or a real-time refetch) makes them stale.
  // Debounced: a burst of order events (busy service) refreshes them once.
  useEffect(() => {
    const timer = setTimeout(() => void queryClient.invalidateQueries({ queryKey: ["orders"] }), 1500);
    return () => clearTimeout(timer);
  }, [workspace.orders, queryClient]);

  useEffect(() => {
    // Aborted on sign-out, reload or unmount, so a stale load never lands.
    const controller = new AbortController();
    const cancelled = () => controller.signal.aborted;
    if (!signedIn) {
      setWorkspace(EMPTY_WORKSPACE);
      setStatus("idle");
      return;
    }
    const background = backgroundLoad.current;
    backgroundLoad.current = false;
    if (!background) {
      setStatus("loading");
      setError(null);
    }
    (async () => {
      const res = await fetch("/api/proxy/platforms/me", { cache: "no-store", signal: controller.signal });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`Failed to fetch platform: ${res.status}`);
      const data = (await res.json()) as PlatformApiResponse;
      return mapPlatformResponse(data);
    })()
      .then((initialPlatform) => {
        if (cancelled()) return;
        if (!initialPlatform) {
          setWorkspace(EMPTY_WORKSPACE);
          return null;
        }
        return fetchWorkspaceData(initialPlatform.id, initialPlatform.domain, initialPlatform.name, {
          phone: initialPlatform.phone ?? undefined,
          email: initialPlatform.email ?? undefined,
          address: initialPlatform.address ?? undefined,
          logoUrl: initialPlatform.logoUrl ?? undefined,
        }, controller.signal).then((data) => ({ ...data, pusher: initialPlatform.pusher, databaseName: initialPlatform.databaseName }));
      })
      .then((data) => {
        if (cancelled()) return;
        if (data) setWorkspace(data);
        setStatus("success");
      })
      .catch((err) => {
        if (cancelled() || isAbortError(err)) return;
        if (background) {
          toast.error(errorMessage(err, t("errors.workspaceRefresh")));
          return;
        }
        setError(errorMessage(err, t("errors.workspaceLoad")));
        setStatus("error");
      });
    return () => controller.abort();
  }, [signedIn, reloadKey]);

  // Real-time refetches: a newer refetch aborts the one still in flight, so a
  // burst of order events results in one up-to-date response, not a queue.
  const ordersRefetch = useRef<AbortController | null>(null);
  const bookingsRefetch = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      ordersRefetch.current?.abort();
      bookingsRefetch.current?.abort();
    },
    [],
  );

  // Real-time: apply what each event carries (the order or table row) instead
  // of refetching every order on every device. A device's own echo changes
  // nothing (upsertById returns the same list). Only check-out, which closes a
  // table's orders without per-order events, refetches.
  const channel = usePlatformSocket(status === "success" && workspace.id ? workspace.id : null, workspace.pusher);
  const orderSeen = useRef(new Map<string, number>());
  useEffect(() => {
    if (!channel) return;
    const setList = <K extends "orders" | "tables">(key: K, next: (list: Workspace[K]) => Workspace[K]) =>
      setWorkspace((w) => {
        const list = next(w[key]);
        return list === w[key] ? w : { ...w, [key]: list };
      });
    const onOrder = ({ order }: { order?: ApiOrder & { updated_at?: string } }) => {
      if (!order?.id || !isNewer(orderSeen.current, order.id, order.updated_at)) return;
      const mapped = mapOrder(order);
      setList("orders", (orders) => upsertById(orders, mapped));
    };
    const onOrderDeleted = ({ id }: { id?: string }) => {
      if (id) setList("orders", (orders) => removeById(orders, id));
    };
    const onTable = ({ table }: { table?: ApiTable }) => {
      if (!table?.id) return;
      const mapped = mapTable(table);
      setList("tables", (tables) => upsertById(tables, mapped));
    };
    // Latest-wins: a newer refetch aborts the one still in flight.
    const refetchAfterCheckout = async () => {
      ordersRefetch.current?.abort();
      const controller = new AbortController();
      ordersRefetch.current = controller;
      try {
        const fresh = await fetchOrdersAndTables(controller.signal);
        setWorkspace((w) => ({ ...w, ...fresh }));
      } catch (err) {
        if (!isAbortError(err)) console.error("Refetch after check-out failed:", err);
      }
    };
    let checkoutTimer: ReturnType<typeof setTimeout> | undefined;
    const onCheckedOut = () => {
      clearTimeout(checkoutTimer); // a burst of check-outs → one refetch
      checkoutTimer = setTimeout(refetchAfterCheckout, 300);
    };
    channel.bind("order:created", onOrder);
    channel.bind("order:updated", onOrder);
    channel.bind("order:deleted", onOrderDeleted);
    channel.bind("table:updated", onTable);
    channel.bind("table:checked_out", onCheckedOut);
    return () => {
      clearTimeout(checkoutTimer);
      channel.unbind("order:created", onOrder);
      channel.unbind("order:updated", onOrder);
      channel.unbind("order:deleted", onOrderDeleted);
      channel.unbind("table:updated", onTable);
      channel.unbind("table:checked_out", onCheckedOut);
    };
  }, [channel]);

  const value = useMemo<WorkspaceContextValue>(() => {
    const patch = (fn: (w: Workspace) => Partial<Workspace>) =>
      setWorkspace((w) => ({ ...w, ...fn(w) }));
    const flow = LEXICON[workspace.domain].flow;
    const currency = workspace.settings.currency;

    /** Starts a latest-wins refetch: aborts the previous one held in `ref`. */
    const restart = (ref: { current: AbortController | null }) => {
      ref.current?.abort();
      const controller = new AbortController();
      ref.current = controller;
      return controller.signal;
    };
    const refetchOrdersAndTables = async () => {
      const signal = restart(ordersRefetch);
      try {
        const [ordersRes, tablesRes] = await Promise.all([
          apiFetch<{ orders: ApiOrder[] }>("/orders", { signal }),
          apiFetch<{ tables: ApiTable[] }>("/tables", { signal }),
        ]);
        patch(() => ({ orders: ordersRes.orders.map(mapOrder), tables: tablesRes.tables.map(mapTable) }));
      } catch (err) {
        if (!isAbortError(err)) throw err; // superseded by a newer refetch
      }
    };
    const refetchTables = async () => {
      const { tables } = await apiFetch<{ tables: ApiTable[] }>("/tables");
      patch(() => ({ tables: tables.map(mapTable) }));
    };
    const refetchTablesAndBookings = async () => {
      const signal = restart(bookingsRefetch);
      let tablesRes: { tables: ApiTable[] };
      let bookingsRes: { bookings: ApiBookingRaw[] };
      try {
        [tablesRes, bookingsRes] = await Promise.all([
          apiFetch<{ tables: ApiTable[] }>("/tables", { signal }),
          apiFetch<{ bookings: ApiBookingRaw[] }>("/bookings", { signal }),
        ]);
      } catch (err) {
        if (isAbortError(err)) return; // superseded by a newer refetch
        throw err;
      }
      const tables = tablesRes.tables.map(mapTable);
      const tableNameById = new Map(tables.map((t) => [t.id, t.name]));
      patch(() => ({
        tables,
        bookings: bookingsRes.bookings.map((b) => mapBooking(b, tableNameById, b.table_id)),
      }));
    };

    return {
      workspace,
      hydrated,
      status,
      error,
      reload: () => setReloadKey((k) => k + 1),
      refresh: () => {
        backgroundLoad.current = true;
        setReloadKey((k) => k + 1);
      },
      flow,
      currency,
      fmt: (v: number) => money(v, currency),

      // Also refreshes tables: a new order can seat a table (auto-seat on first
      // round), so anything reacting to "new order" needs both in sync.
      refreshOrders: refetchOrdersAndTables,

      saveTable: async (table) => {
        const body = { name: table.name, seats: table.seats, zone: table.zone };
        const res = table.id
          ? await apiFetch<{ table: ApiTable }>(`/tables/${table.id}`, {
              method: "PATCH",
              body: JSON.stringify(body),
            })
          : await apiFetch<{ table: ApiTable }>("/tables", {
              method: "POST",
              body: JSON.stringify(body),
            });
        const saved = mapTable(res.table);
        patch((w) => ({
          tables: table.id ? w.tables.map((t) => (t.id === saved.id ? saved : t)) : [...w.tables, saved],
          zones: !saved.zone || w.zones.includes(saved.zone) ? w.zones : [...w.zones, saved.zone],
        }));
      },
      deleteTable: async (id) => {
        await apiFetch(`/tables/${id}`, { method: "DELETE" });
        patch((w) => ({ tables: w.tables.filter((t) => t.id !== id) }));
      },

      saveCategory: async (category) => {
        const body = { name: category.name, isActive: category.valid };
        const res = category.id
          ? await apiFetch<{ category: ApiCategory }>(`/categories/${category.id}`, {
              method: "PATCH",
              body: JSON.stringify(body),
            })
          : await apiFetch<{ category: ApiCategory }>("/categories", {
              method: "POST",
              body: JSON.stringify(body),
            });
        const saved = mapCategory(res.category);
        patch((w) => ({
          categories: category.id
            ? w.categories.map((c) => (c.id === saved.id ? saved : c))
            : [...w.categories, saved],
        }));
        return saved;
      },
      reorderCategories: async (ids) => {
        // The order to go back to if the save fails.
        const previous = workspace.categories;
        const position = new Map(ids.map((id, i) => [id, i]));
        patch((w) => ({
          categories: [...w.categories].sort(
            (a, b) => (position.get(a.id) ?? Infinity) - (position.get(b.id) ?? Infinity),
          ),
        }));
        try {
          await apiFetch("/categories/order", { method: "PUT", body: JSON.stringify({ ids }) });
        } catch (err) {
          patch(() => ({ categories: previous }));
          throw err;
        }
      },
      deleteCategory: async (id) => {
        await apiFetch(`/categories/${id}`, { method: "DELETE" });
        patch((w) => ({
          categories: w.categories.filter((c) => c.id !== id),
          dishes: w.dishes.filter((d) => d.catId !== id),
        }));
      },

      saveDish: async (dish) => {
        const body = {
          name: dish.name,
          price: dish.price,
          categoryId: dish.catId || null,
          description: dish.description ?? null,
          taxMode: dish.taxMode,
          taxName: dish.taxName ?? null,
          taxPct: dish.taxPct ?? null,
          status: dish.status,
          isVegan: dish.isVegan ?? false,
          imageUrl: dish.imageUrl ?? null,
        };
        const res = dish.id
          ? await apiFetch<{ dish: ApiDish }>(`/dishes/${dish.id}`, {
              method: "PATCH",
              body: JSON.stringify(body),
            })
          : await apiFetch<{ dish: ApiDish }>("/dishes", {
              method: "POST",
              body: JSON.stringify(body),
            });
        const saved = mapDish(res.dish);
        patch((w) => ({
          dishes: dish.id ? w.dishes.map((d) => (d.id === saved.id ? saved : d)) : [...w.dishes, saved],
        }));
      },
      deleteDish: async (id) => {
        await apiFetch(`/dishes/${id}`, { method: "DELETE" });
        patch((w) => ({ dishes: w.dishes.filter((d) => d.id !== id) }));
      },

      addOrder: async ({ tableName, itemId, qty }) => {
        const { order } = await apiFetch<{ order: ApiOrder }>("/orders", {
          method: "POST",
          body: JSON.stringify({ tableName, status: flow[0], lines: [{ itemId, qty }] }),
        });
        // Each round is its own order: apply it, and refetch only the tables
        // (a first round seats the table), not every order.
        patch((w) => ({ orders: upsertById(w.orders, mapOrder(order)) }));
        await refetchTables();
      },
      placeOrder: async (tableName, lines) => {
        if (!lines.length) throw new Error("placeOrder called with no lines");
        const { order } = await apiFetch<{ order: ApiOrder }>("/orders", {
          method: "POST",
          body: JSON.stringify({ tableName, status: flow[0], lines }),
        });
        const placed = mapOrder(order);
        patch((w) => ({ orders: upsertById(w.orders, placed) }));
        await refetchTables();
        return placed;
      },
      advanceOrder: async (id) => {
        const current = workspace.orders.find((o) => o.id === id);
        if (!current) return;
        const i = flow.indexOf(current.status);
        if (i < 0 || i >= flow.length - 1) return;
        const nextStatus = flow[i + 1];
        const res = await apiFetch<{ order: ApiOrder }>(`/orders/${id}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        });
        const order = mapOrder(res.order);
        patch((w) => ({ orders: w.orders.map((o) => (o.id === id ? order : o)) }));
      },
      deleteOrder: async (id) => {
        await apiFetch(`/orders/${id}`, { method: "DELETE" });
        patch((w) => ({ orders: w.orders.filter((o) => o.id !== id) }));
      },
      setOrderLineQty: async (orderId, itemId, qty) => {
        const order = workspace.orders.find((o) => o.id === orderId);
        const line = order?.lines.find((l) => l.itemId === itemId);
        if (!order || !line?.id) return;
        const res = await apiFetch<{ order: ApiOrder }>(`/orders/${orderId}/lines/${line.id}`, {
          method: "PATCH",
          body: JSON.stringify({ qty }),
        });
        const updated = mapOrder(res.order);
        patch((w) => ({ orders: w.orders.map((o) => (o.id === orderId ? updated : o)) }));
      },
      addOrderLine: async (orderId, itemId) => {
        const res = await apiFetch<{ order: ApiOrder }>(`/orders/${orderId}/lines`, {
          method: "POST",
          body: JSON.stringify({ itemId }),
        });
        const updated = mapOrder(res.order);
        patch((w) => ({ orders: w.orders.map((o) => (o.id === orderId ? updated : o)) }));
      },

      saveBooking: async (booking) => {
        const res = await apiFetch<{ booking: ApiBookingRaw }>("/bookings", {
          method: "POST",
          body: JSON.stringify({
            name: booking.name,
            time: booking.time,
            party: booking.party,
            date: booking.date ?? dayKey(new Date()),
          }),
        });
        let created = mapBooking(res.booking, new Map(), null);
        if (booking.tableName) {
          const table = workspace.tables.find((t) => t.name === booking.tableName);
          if (table) {
            const assignRes = await apiFetch<{ booking: ApiBookingRaw; table: ApiTable }>(
              `/bookings/${res.booking.id}/assign`,
              { method: "POST", body: JSON.stringify({ tableId: table.id }) },
            );
            created = mapBooking(assignRes.booking, new Map([[table.id, table.name]]), table.id);
            patch((w) => ({
              tables: w.tables.map((t) => (t.id === table.id ? mapTable(assignRes.table) : t)),
            }));
          }
        }
        patch((w) => ({ bookings: [...w.bookings, created] }));
      },
      toggleBooking: async (id) => {
        const current = workspace.bookings.find((b) => b.id === id);
        if (!current) return;
        const nextStatus = current.status === "Arrived" ? "Confirmed" : "Arrived";
        await apiFetch(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
        patch((w) => ({
          bookings: w.bookings.map((b) => (b.id === id ? { ...b, status: nextStatus } : b)),
        }));
      },
      deleteBooking: async (id) => {
        await apiFetch(`/bookings/${id}`, { method: "DELETE" });
        patch((w) => ({ bookings: w.bookings.filter((b) => b.id !== id) }));
      },
      assignBooking: async (bookingId, tableId) => {
        const table = workspace.tables.find((t) => t.id === tableId);
        if (!table) return;
        await apiFetch(`/bookings/${bookingId}/assign`, {
          method: "POST",
          body: JSON.stringify({ tableId }),
        });
        patch((w) => ({
          bookings: w.bookings.map((b) => (b.id === bookingId ? { ...b, tableName: table.name } : b)),
          tables: w.tables.map((t) => (t.id === tableId ? { ...t, state: "Booked" } : t)),
        }));
      },
      unassignBooking: async (bookingId) => {
        const booking = workspace.bookings.find((b) => b.id === bookingId);
        await apiFetch(`/bookings/${bookingId}/unassign`, { method: "POST" });
        patch((w) => ({
          bookings: w.bookings.map((b) => (b.id === bookingId ? { ...b, tableName: null } : b)),
          tables: w.tables.map((t) =>
            t.name === booking?.tableName && t.state === "Booked" ? { ...t, state: "Free" } : t,
          ),
        }));
      },

      seatTable: async (id) => {
        const res = await apiFetch<{ table: ApiTable }>(`/tables/${id}/seat`, { method: "POST" });
        const saved = mapTable(res.table);
        patch((w) => ({ tables: w.tables.map((t) => (t.id === id ? saved : t)) }));
      },
      checkoutTable: async (id) => {
        await apiFetch(`/tables/${id}/checkout`, { method: "POST" });
        await refetchOrdersAndTables();
      },
      freeTable: async (id) => {
        await apiFetch(`/tables/${id}/free`, { method: "POST" });
        await refetchTablesAndBookings();
      },

      updateSettings: async (p) => {
        await apiFetch("/settings", {
          method: "PATCH",
          body: JSON.stringify({ currency: p.currency, taxRate: p.taxRate }),
        });
        patch((w) => ({ settings: { ...w.settings, ...p } }));
      },
      updateProfile: async (p) => {
        await apiFetch("/platforms/me", {
          method: "PATCH",
          body: JSON.stringify(p),
        });
        patch(() => ({ ...p }));
      },
      addSpecialTax: async (tax) => {
        const res = await apiFetch<{ specialTax: ApiSpecialTax }>("/settings/special-taxes", {
          method: "POST",
          body: JSON.stringify({ name: tax.name, pct: tax.pct }),
        });
        const saved = mapSpecialTax(res.specialTax);
        patch((w) => ({
          settings: { ...w.settings, specialTaxes: [...w.settings.specialTaxes, saved] },
        }));
      },
      removeSpecialTax: async (id) => {
        await apiFetch(`/settings/special-taxes/${id}`, { method: "DELETE" });
        patch((w) => ({
          settings: {
            ...w.settings,
            specialTaxes: w.settings.specialTaxes.filter((t) => t.id !== id),
          },
        }));
      },
    };
  }, [workspace, hydrated, status, error, signedIn]);

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
