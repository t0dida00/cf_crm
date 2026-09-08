"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch } from "@/lib/api";
import { money } from "@/lib/range";
import type { PlatformRecord } from "@/lib/platform-api";
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

interface WorkspaceContextValue {
  workspace: Workspace;
  hydrated: boolean;
  flow: string[];
  currency: string;
  fmt: (value: number) => string;
  refreshOrders: () => Promise<void>;
  saveTable: (
    table: Omit<TableRec, "id" | "state" | "seatedAt"> & { id?: string },
  ) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
  saveCategory: (category: Omit<Category, "id"> & { id?: string }) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  saveDish: (dish: Omit<Dish, "id"> & { id?: string }) => Promise<void>;
  deleteDish: (id: string) => Promise<void>;
  addOrder: (input: { tableName: string; itemId: string; qty: number }) => Promise<void>;
  placeOrder: (
    tableName: string,
    lines: { itemId: string; qty: number; note?: string }[],
  ) => Promise<void>;
  advanceOrder: (id: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  setOrderLineQty: (orderId: string, itemId: string, qty: number) => Promise<void>;
  addOrderLine: (orderId: string, itemId: string) => Promise<void>;
  saveBooking: (booking: Omit<Booking, "id" | "ts">) => Promise<void>;
  toggleBooking: (id: string) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  assignBooking: (bookingId: string, tableId: string) => Promise<void>;
  unassignBooking: (bookingId: string) => Promise<void>;
  seatTable: (id: string) => Promise<void>;
  checkoutTable: (id: string) => Promise<void>;
  freeTable: (id: string) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  addSpecialTax: (tax: Omit<SpecialTax, "id">) => Promise<void>;
  removeSpecialTax: (id: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const emptyWorkspace: Workspace = {
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
  is_available: boolean;
  is_vegan: boolean;
  image_url: string | null;
}
const mapDish = (d: ApiDish): Dish => ({
  id: d.id,
  name: d.name,
  price: Number(d.price),
  catId: d.category_id ?? "",
  valid: d.is_available,
  taxMode: d.tax_mode as Dish["taxMode"],
  description: d.description ?? undefined,
  taxName: d.tax_name ?? undefined,
  taxPct: d.tax_pct !== null ? Number(d.tax_pct) : undefined,
  isVegan: d.is_vegan,
  imageUrl: d.image_url ?? undefined,
});

interface ApiOrderLine {
  id: string;
  item_id: string;
  name: string;
  price: string | number;
  qty: number;
  note: string | null;
}
interface ApiOrder {
  id: string;
  code: string;
  table_name: string;
  total: string | number;
  tax_rate: string | number;
  status: string;
  ts: string;
  closed_ts: string | null;
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
const mapOrder = (o: ApiOrder): Order => ({
  id: o.id,
  code: o.code,
  tableName: o.table_name,
  lines: o.order_lines.map(mapOrderLine),
  total: Number(o.total),
  taxRate: Number(o.tax_rate),
  ts: new Date(o.ts).getTime(),
  status: o.status,
  closedTs: o.closed_ts ? new Date(o.closed_ts).getTime() : null,
});

interface ApiBooking {
  id: string;
  name: string;
  time: string;
  party: number;
  status: string;
  date: string;
  tables?: { name: string } | null;
}
const mapBooking = (b: ApiBooking, tableNameById: Map<string, string>, tableId?: string | null): Booking => ({
  id: b.id,
  name: b.name,
  time: b.time,
  party: b.party,
  tableName: tableId ? tableNameById.get(tableId) ?? null : null,
  status: b.status as Booking["status"],
  ts: new Date(b.date).getTime(),
});

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

async function fetchWorkspaceData(domain: "restaurant" | "cafe", name: string, contact: {
  phone?: string;
  email?: string;
  address?: string;
}): Promise<Workspace> {
  const [tablesRes, categoriesRes, dishesRes, ordersRes, bookingsRes, settingsRes] = await Promise.all([
    apiFetch<{ tables: ApiTable[] }>("/tables"),
    apiFetch<{ categories: ApiCategory[] }>("/categories"),
    apiFetch<{ dishes: ApiDish[] }>("/dishes"),
    apiFetch<{ orders: ApiOrder[] }>("/orders"),
    apiFetch<{ bookings: ApiBookingRaw[] }>("/bookings"),
    apiFetch<{ settings: ApiSettings }>("/settings"),
  ]);

  const tables = tablesRes.tables.map(mapTable);
  const tableNameById = new Map(tables.map((t) => [t.id, t.name]));
  const zones = Array.from(new Set(tables.map((t) => t.zone).filter(Boolean)));

  return {
    name,
    domain,
    phone: contact.phone,
    email: contact.email,
    address: contact.address,
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
 * `initialPlatform` is the source of truth for workspace identity (name, domain,
 * contact details), fetched server-side from the platforms table. All operational
 * data (tables, menu, orders, bookings, settings) is fetched from CRM_backend on
 * mount and mutated through it directly — nothing is persisted to localStorage.
 */
export function WorkspaceProvider({
  children,
  initialPlatform = null,
}: {
  children: ReactNode;
  initialPlatform?: PlatformRecord | null;
}) {
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!initialPlatform) {
      setWorkspace(emptyWorkspace);
      setHydrated(true);
      return;
    }
    setHydrated(false);
    fetchWorkspaceData(initialPlatform.domain, initialPlatform.name, {
      phone: initialPlatform.phone ?? undefined,
      email: initialPlatform.email ?? undefined,
      address: initialPlatform.address ?? undefined,
    })
      .then((data) => {
        if (!cancelled) setWorkspace(data);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlatform?.id]);

  const value = useMemo<WorkspaceContextValue>(() => {
    const patch = (fn: (w: Workspace) => Partial<Workspace>) =>
      setWorkspace((w) => ({ ...w, ...fn(w) }));
    const flow = LEXICON[workspace.domain].flow;
    const currency = workspace.settings.currency;

    const refetchOrdersAndTables = async () => {
      const [ordersRes, tablesRes] = await Promise.all([
        apiFetch<{ orders: ApiOrder[] }>("/orders"),
        apiFetch<{ tables: ApiTable[] }>("/tables"),
      ]);
      patch(() => ({ orders: ordersRes.orders.map(mapOrder), tables: tablesRes.tables.map(mapTable) }));
    };
    const refetchTablesAndBookings = async () => {
      const [tablesRes, bookingsRes] = await Promise.all([
        apiFetch<{ tables: ApiTable[] }>("/tables"),
        apiFetch<{ bookings: ApiBookingRaw[] }>("/bookings"),
      ]);
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
          zones: w.zones.includes(saved.zone) ? w.zones : [...w.zones, saved.zone],
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
          isAvailable: dish.valid,
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
        await apiFetch<{ order: ApiOrder }>("/orders", {
          method: "POST",
          body: JSON.stringify({ tableName, status: flow[0], lines: [{ itemId, qty }] }),
        });
        // Repeat order rounds merge into the table's existing open order rather than
        // creating a new one, and the first round seats the table — refetch both
        // rather than hand-patching so local state always matches the merge outcome.
        await refetchOrdersAndTables();
      },
      placeOrder: async (tableName, lines) => {
        if (!lines.length) return;
        await apiFetch<{ order: ApiOrder }>("/orders", {
          method: "POST",
          body: JSON.stringify({ tableName, status: flow[0], lines }),
        });
        await refetchOrdersAndTables();
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
          body: JSON.stringify({ name: booking.name, time: booking.time, party: booking.party }),
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
  }, [workspace, hydrated]);

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
