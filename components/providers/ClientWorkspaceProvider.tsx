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
import { useQuery } from "@tanstack/react-query";
import { publicApiFetch } from "@/lib/publicApi";
import { isAbortError } from "@/lib/http";
import { errorMessage, toRequestStatus, type RequestStatus } from "@/lib/requestStatus";
import { money } from "@/lib/range";
import { useTranslation } from "react-i18next";
import type { Category, Dish, Order, OrderLine, PusherConfig, TableRec, TableRequestType } from "@/lib/types";

interface ClientWorkspace {
  name: string;
  address: string | null;
  phone: string | null;
  logoUrl: string | null;
  categories: Category[];
  dishes: Dish[];
  tables: TableRec[];
  currency: string;
  taxRate: number;
  /** The business's own Pusher app; null = the shared app from env. */
  pusher: PusherConfig | null;
}

interface ClientWorkspaceContextValue {
  workspace: ClientWorkspace;
  hydrated: boolean;
  /** Menu/tables/settings load: loading → success | error. */
  status: RequestStatus;
  error: string | null;
  reload: () => void;
  /** Always true for this provider — a guest browsing /client has no session. */
  isGuest: true;
  fmt: (value: number) => string;
  /** Still-open orders for one table (cleared once staff check the table out). */
  tableOrders: Order[];
  /** Fetches this table's currently-open orders — call once the table name is
   * known, and again after placing an order so the guest sees it immediately. */
  refreshTableOrders: (tableName: string) => Promise<void>;
  placeOrder: (
    tableName: string,
    lines: { itemId: string; qty: number; note?: string }[],
  ) => Promise<Order>;
  createTableRequest: (input: { tableName: string; type: TableRequestType }) => Promise<void>;
}

const ClientWorkspaceContext = createContext<ClientWorkspaceContextValue | null>(null);

const EMPTY_WORKSPACE: ClientWorkspace = {
  name: "",
  address: null,
  phone: null,
  logoUrl: null,
  categories: [],
  dishes: [],
  tables: [],
  currency: "€",
  taxRate: 0,
  pusher: null,
};

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
  is_best_seller: boolean;
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
  isBestSeller: d.is_best_seller,
});

interface ApiTable {
  id: string;
  name: string;
}
const mapTable = (t: ApiTable): TableRec => ({
  id: t.id,
  name: t.name,
  seats: 0,
  zone: "",
  state: "Free",
  seatedAt: null,
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
  sessionId: o.session_id,
});

export function ClientWorkspaceProvider({
  platformId,
  children,
}: {
  platformId: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  // Latest-wins: each table-orders refresh aborts the one still in flight.
  const ordersRefresh = useRef<AbortController | null>(null);
  useEffect(() => () => ordersRefresh.current?.abort(), []);

  const workspaceQuery = useQuery({
    queryKey: ["public", platformId, "workspace"],
    queryFn: async ({ signal }): Promise<ClientWorkspace> => {
      const [menuRes, tablesRes, settingsRes] = await Promise.all([
        publicApiFetch<{ categories: ApiCategory[]; dishes: ApiDish[] }>(platformId, "/menu", { signal }),
        publicApiFetch<{ tables: ApiTable[] }>(platformId, "/tables", { signal }),
        publicApiFetch<{
          settings: {
            name: string;
            address: string | null;
            phone: string | null;
            logoUrl: string | null;
            currency: string;
            taxRate: string | number;
            pusher?: PusherConfig | null;
          };
        }>(platformId, "/settings", { signal }),
      ]);
      return {
        name: settingsRes.settings.name,
        address: settingsRes.settings.address,
        phone: settingsRes.settings.phone,
        logoUrl: settingsRes.settings.logoUrl,
        categories: menuRes.categories.map(mapCategory),
        dishes: menuRes.dishes.map(mapDish),
        tables: tablesRes.tables.map(mapTable),
        currency: settingsRes.settings.currency,
        taxRate: Number(settingsRes.settings.taxRate),
        pusher: settingsRes.settings.pusher ?? null,
      };
    },
  });
  const workspace = workspaceQuery.data ?? EMPTY_WORKSPACE;
  const hydrated = !workspaceQuery.isPending;
  const status = toRequestStatus(workspaceQuery);
  const error = workspaceQuery.isError
    ? errorMessage(workspaceQuery.error, t("client.loadFailed"))
    : null;
  const reload = workspaceQuery.refetch;

  const value = useMemo<ClientWorkspaceContextValue>(
    () => ({
      workspace,
      hydrated,
      status,
      error,
      reload: () => void reload(),
      isGuest: true,
      fmt: (v: number) => money(v, workspace.currency),
      tableOrders,
      refreshTableOrders: async (tableName) => {
        ordersRefresh.current?.abort();
        const controller = new AbortController();
        ordersRefresh.current = controller;
        try {
          const res = await publicApiFetch<{ orders: ApiOrder[] }>(
            platformId,
            `/orders?table=${encodeURIComponent(tableName)}`,
            { signal: controller.signal },
          );
          setTableOrders(res.orders.map(mapOrder));
        } catch (err) {
          if (!isAbortError(err)) throw err; // superseded by a newer refresh
        }
      },
      placeOrder: async (tableName, lines) => {
        if (!lines.length) throw new Error("placeOrder called with no lines");
        const { order } = await publicApiFetch<{ order: ApiOrder }>(platformId, "/orders", {
          method: "POST",
          body: JSON.stringify({ tableName, lines }),
        });
        const res = await publicApiFetch<{ orders: ApiOrder[] }>(
          platformId,
          `/orders?table=${encodeURIComponent(tableName)}`,
        );
        setTableOrders(res.orders.map(mapOrder));
        return mapOrder(order);
      },
      createTableRequest: async ({ tableName, type }) => {
        await publicApiFetch(platformId, "/requests", {
          method: "POST",
          body: JSON.stringify({ tableName, type }),
        });
      },
    }),
    [workspace, hydrated, status, error, reload, platformId, tableOrders],
  );

  return (
    <ClientWorkspaceContext.Provider value={value}>{children}</ClientWorkspaceContext.Provider>
  );
}

export function useClientWorkspace() {
  const ctx = useContext(ClientWorkspaceContext);
  if (!ctx) throw new Error("useClientWorkspace must be used inside <ClientWorkspaceProvider>");
  return ctx;
}
