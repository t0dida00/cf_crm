"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { publicApiFetch } from "@/lib/public-api";
import { money } from "@/lib/range";
import type { Category, Dish, Order, OrderLine, TableRec, TableRequestType } from "@/lib/types";

interface ClientWorkspace {
  name: string;
  address: string | null;
  phone: string | null;
  categories: Category[];
  dishes: Dish[];
  tables: TableRec[];
  currency: string;
  taxRate: number;
}

interface ClientWorkspaceContextValue {
  workspace: ClientWorkspace;
  hydrated: boolean;
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

const emptyWorkspace: ClientWorkspace = {
  name: "",
  address: null,
  phone: null,
  categories: [],
  dishes: [],
  tables: [],
  currency: "€",
  taxRate: 0,
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
  const [workspace, setWorkspace] = useState<ClientWorkspace>(emptyWorkspace);
  const [hydrated, setHydrated] = useState(false);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    Promise.all([
      publicApiFetch<{ categories: ApiCategory[]; dishes: ApiDish[] }>(platformId, "/menu"),
      publicApiFetch<{ tables: ApiTable[] }>(platformId, "/tables"),
      publicApiFetch<{
        settings: {
          name: string;
          address: string | null;
          phone: string | null;
          currency: string;
          taxRate: string | number;
        };
      }>(platformId, "/settings"),
    ])
      .then(([menuRes, tablesRes, settingsRes]) => {
        if (cancelled) return;
        setWorkspace({
          name: settingsRes.settings.name,
          address: settingsRes.settings.address,
          phone: settingsRes.settings.phone,
          categories: menuRes.categories.map(mapCategory),
          dishes: menuRes.dishes.map(mapDish),
          tables: tablesRes.tables.map(mapTable),
          currency: settingsRes.settings.currency,
          taxRate: Number(settingsRes.settings.taxRate),
        });
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [platformId]);

  const value = useMemo<ClientWorkspaceContextValue>(
    () => ({
      workspace,
      hydrated,
      isGuest: true,
      fmt: (v: number) => money(v, workspace.currency),
      tableOrders,
      refreshTableOrders: async (tableName) => {
        const res = await publicApiFetch<{ orders: ApiOrder[] }>(
          platformId,
          `/orders?table=${encodeURIComponent(tableName)}`,
        );
        setTableOrders(res.orders.map(mapOrder));
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
    [workspace, hydrated, platformId, tableOrders],
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
