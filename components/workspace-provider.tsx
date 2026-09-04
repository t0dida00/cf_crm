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
  Settings,
  SpecialTax,
  TableRec,
  Workspace,
} from "@/lib/types";
import { LEXICON } from "@/lib/lexicon";

let counter = 0;
const nextId = (prefix: string) => `${prefix}${Date.now().toString(36)}${counter++}`;

interface WorkspaceContextValue {
  workspace: Workspace;
  flow: string[];
  currency: string;
  fmt: (value: number) => string;
  create: (name: string, domain: Domain, withDemoData?: boolean) => void;
  saveTable: (table: Omit<TableRec, "id"> & { id?: string }) => void;
  deleteTable: (id: string) => void;
  saveCategory: (category: Omit<Category, "id"> & { id?: string }) => void;
  deleteCategory: (id: string) => void;
  saveDish: (dish: Omit<Dish, "id"> & { id?: string }) => void;
  deleteDish: (id: string) => void;
  addOrder: (input: { tableName: string; itemId: string; qty: number }) => void;
  advanceOrder: (id: string) => void;
  saveBooking: (booking: Omit<Booking, "id" | "ts">) => void;
  toggleBooking: (id: string) => void;
  deleteBooking: (id: string) => void;
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
            ? w.tables.map((t) => (t.id === table.id ? { ...t, ...table } as TableRec : t))
            : [...w.tables, { ...table, id: nextId("t") } as TableRec];
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
