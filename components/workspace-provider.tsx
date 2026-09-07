"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { seedWorkspace } from "@/lib/seed";
import { money } from "@/lib/range";
import type {
  Booking,
  Category,
  Dish,
  Domain,
  Order,
  OrderLine,
  Settings,
  SpecialTax,
  TableRec,
  Workspace,
} from "@/lib/types";
import { lineTotal } from "@/lib/order-math";
import { LEXICON } from "@/lib/lexicon";

let counter = 0;
const nextId = (prefix: string) => `${prefix}${Date.now().toString(36)}${counter++}`;

interface WorkspaceContextValue {
  workspace: Workspace;
  flow: string[];
  currency: string;
  fmt: (value: number) => string;
  create: (name: string, domain: Domain, withDemoData?: boolean) => void;
  saveTable: (
    table: Omit<TableRec, "id" | "state" | "seatedAt"> & { id?: string },
  ) => void;
  deleteTable: (id: string) => void;
  saveCategory: (category: Omit<Category, "id"> & { id?: string }) => void;
  deleteCategory: (id: string) => void;
  saveDish: (dish: Omit<Dish, "id"> & { id?: string }) => void;
  deleteDish: (id: string) => void;
  addOrder: (input: { tableName: string; itemId: string; qty: number }) => void;
  placeOrder: (
    tableName: string,
    lines: { itemId: string; qty: number; note?: string }[],
  ) => void;
  advanceOrder: (id: string) => void;
  deleteOrder: (id: string) => void;
  setOrderLineQty: (orderId: string, itemId: string, qty: number) => void;
  addOrderLine: (orderId: string, itemId: string) => void;
  saveBooking: (booking: Omit<Booking, "id" | "ts">) => void;
  toggleBooking: (id: string) => void;
  deleteBooking: (id: string) => void;
  assignBooking: (bookingId: string, tableId: string) => void;
  unassignBooking: (bookingId: string) => void;
  seatTable: (id: string) => void;
  checkoutTable: (id: string) => void;
  freeTable: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addSpecialTax: (tax: SpecialTax) => void;
  removeSpecialTax: (index: number) => void;
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

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace);

  const value = useMemo<WorkspaceContextValue>(() => {
    const patch = (fn: (w: Workspace) => Partial<Workspace>) =>
      setWorkspace((w) => ({ ...w, ...fn(w) }));
    const flow = LEXICON[workspace.domain].flow;
    const currency = workspace.settings.currency;

    return {
      workspace,
      flow,
      currency,
      fmt: (v: number) => money(v, currency),

      create: (name, domain, withDemoData = true) =>
        setWorkspace(seedWorkspace(name, domain, withDemoData)),

      saveTable: (table) =>
        patch((w) => {
          const zones = table.zone && !w.zones.includes(table.zone)
            ? [...w.zones, table.zone]
            : w.zones;
          const tables = table.id
            ? w.tables.map((t) => (t.id === table.id ? { ...t, ...table } : t))
            : [
                ...w.tables,
                { ...table, id: nextId("t"), state: "Free", seatedAt: null } as TableRec,
              ];
          return { zones, tables };
        }),
      deleteTable: (id) =>
        patch((w) => ({ tables: w.tables.filter((t) => t.id !== id) })),

      saveCategory: (category) =>
        patch((w) => ({
          categories: category.id
            ? w.categories.map((c) =>
                c.id === category.id ? ({ ...c, ...category } as Category) : c,
              )
            : [...w.categories, { ...category, id: nextId("c") } as Category],
        })),
      deleteCategory: (id) =>
        patch((w) => ({
          categories: w.categories.filter((c) => c.id !== id),
          dishes: w.dishes.filter((d) => d.catId !== id),
        })),

      saveDish: (dish) =>
        patch((w) => ({
          dishes: dish.id
            ? w.dishes.map((d) => (d.id === dish.id ? ({ ...d, ...dish } as Dish) : d))
            : [...w.dishes, { ...dish, id: nextId("d") } as Dish],
        })),
      deleteDish: (id) => patch((w) => ({ dishes: w.dishes.filter((d) => d.id !== id) })),

      addOrder: ({ tableName, itemId, qty }) =>
        patch((w) => {
          const dish = w.dishes.find((d) => d.id === itemId);
          if (!dish) return {};
          const order: Order = {
            id: nextId("o"),
            code: `ORD-${2401 + w.orders.length}`,
            tableName,
            lines: [{ itemId: dish.id, name: dish.name, price: dish.price, qty }],
            total: dish.price * qty,
            ts: Date.now(),
            status: flow[0],
            closedTs: null,
          };
          return { orders: [order, ...w.orders] };
        }),
      placeOrder: (tableName, lines) =>
        patch((w) => {
          const orderLines: OrderLine[] = lines
            .map(({ itemId, qty, note }): OrderLine | null => {
              const dish = w.dishes.find((d) => d.id === itemId);
              if (!dish) return null;
              return { itemId: dish.id, name: dish.name, price: dish.price, qty, note };
            })
            .filter((l): l is OrderLine => l !== null);
          if (!orderLines.length) return {};
          const order: Order = {
            id: nextId("o"),
            code: `ORD-${2401 + w.orders.length}`,
            tableName,
            lines: orderLines,
            total: lineTotal(orderLines),
            ts: Date.now(),
            status: flow[0],
            closedTs: null,
          };
          return { orders: [order, ...w.orders] };
        }),
      advanceOrder: (id) =>
        patch((w) => ({
          orders: w.orders.map((o) => {
            if (o.id !== id) return o;
            const i = flow.indexOf(o.status);
            return i < 0 || i >= flow.length - 1 ? o : { ...o, status: flow[i + 1] };
          }),
        })),
      deleteOrder: (id) =>
        patch((w) => ({ orders: w.orders.filter((o) => o.id !== id) })),
      setOrderLineQty: (orderId, itemId, qty) =>
        patch((w) => ({
          orders: w.orders.map((o) => {
            if (o.id !== orderId) return o;
            const lines = o.lines
              .map((l) => (l.itemId === itemId ? { ...l, qty } : l))
              .filter((l) => l.qty > 0);
            return { ...o, lines, total: lineTotal(lines) };
          }),
        })),
      addOrderLine: (orderId, itemId) =>
        patch((w) => {
          const dish = w.dishes.find((d) => d.id === itemId);
          if (!dish) return {};
          return {
            orders: w.orders.map((o) => {
              if (o.id !== orderId) return o;
              const existing = o.lines.find((l) => l.itemId === itemId);
              const lines = existing
                ? o.lines.map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + 1 } : l))
                : [...o.lines, { itemId: dish.id, name: dish.name, price: dish.price, qty: 1 }];
              return { ...o, lines, total: lineTotal(lines) };
            }),
          };
        }),

      saveBooking: (booking) =>
        patch((w) => ({
          bookings: [
            ...w.bookings,
            { ...booking, id: nextId("b"), ts: new Date().setHours(0, 0, 0, 0) },
          ],
        })),
      toggleBooking: (id) =>
        patch((w) => ({
          bookings: w.bookings.map((b) =>
            b.id === id
              ? { ...b, status: b.status === "Arrived" ? "Confirmed" : "Arrived" }
              : b,
          ),
        })),
      deleteBooking: (id) =>
        patch((w) => ({ bookings: w.bookings.filter((b) => b.id !== id) })),
      assignBooking: (bookingId, tableId) =>
        patch((w) => {
          const table = w.tables.find((t) => t.id === tableId);
          if (!table) return {};
          return {
            bookings: w.bookings.map((b) =>
              b.id === bookingId ? { ...b, tableName: table.name } : b,
            ),
            tables: w.tables.map((t) =>
              t.id === tableId ? { ...t, state: "Booked" } : t,
            ),
          };
        }),
      unassignBooking: (bookingId) =>
        patch((w) => {
          const booking = w.bookings.find((b) => b.id === bookingId);
          return {
            bookings: w.bookings.map((b) =>
              b.id === bookingId ? { ...b, tableName: null } : b,
            ),
            tables: w.tables.map((t) =>
              t.name === booking?.tableName && t.state === "Booked"
                ? { ...t, state: "Free" }
                : t,
            ),
          };
        }),

      seatTable: (id) =>
        patch((w) => ({
          tables: w.tables.map((t) =>
            t.id === id ? { ...t, state: "Seated", seatedAt: Date.now() } : t,
          ),
        })),
      checkoutTable: (id) =>
        patch((w) => {
          const table = w.tables.find((t) => t.id === id);
          if (!table) return {};
          return {
            orders: w.orders.map((o) =>
              o.tableName === table.name && !o.closedTs
                ? { ...o, status: "Paid", closedTs: Date.now() }
                : o,
            ),
            tables: w.tables.map((t) =>
              t.id === id ? { ...t, state: "Finished", seatedAt: null } : t,
            ),
          };
        }),
      freeTable: (id) =>
        patch((w) => {
          const table = w.tables.find((t) => t.id === id);
          return {
            tables: w.tables.map((t) =>
              t.id === id ? { ...t, state: "Free", seatedAt: null } : t,
            ),
            bookings: w.bookings.map((b) =>
              b.tableName === table?.name ? { ...b, tableName: null } : b,
            ),
          };
        }),

      updateSettings: (p) => patch((w) => ({ settings: { ...w.settings, ...p } })),
      addSpecialTax: (tax) =>
        patch((w) => ({
          settings: { ...w.settings, specialTaxes: [...w.settings.specialTaxes, tax] },
        })),
      removeSpecialTax: (index) =>
        patch((w) => ({
          settings: {
            ...w.settings,
            specialTaxes: w.settings.specialTaxes.filter((_, i) => i !== index),
          },
        })),
    };
  }, [workspace]);

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}
