"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  ChartBar,
  Folders,
  ForkKnife,
  Gear,
  Plus,
  QrCode,
  Receipt,
  SignOut,
  SquaresFour,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/workspace-provider";
import { signOutAction } from "@/app/actions";
import { DashboardPanel } from "@/components/panels/dashboard-panel";
import { TablesPanel } from "@/components/panels/tables-panel";
import { CategoriesPanel } from "@/components/panels/categories-panel";
import { MenuPanel } from "@/components/panels/menu-panel";
import { OrdersPanel } from "@/components/panels/orders-panel";
import { BookingsPanel } from "@/components/panels/bookings-panel";
import { SettingsPanel } from "@/components/panels/settings-panel";
import type { TabId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useNewOrderNotifications } from "@/hooks/use-new-order-notifications";

const NAV: { id: TabId; label: string; Icon: PhosphorIcon }[] = [
  { id: "dash", label: "Dashboard", Icon: ChartBar },
  { id: "tables", label: "Tables", Icon: SquaresFour },
  { id: "categories", label: "Categories", Icon: Folders },
  { id: "menu", label: "Menu", Icon: ForkKnife },
  { id: "orders", label: "Orders", Icon: Receipt },
  { id: "bookings", label: "Bookings", Icon: CalendarCheck },
  { id: "settings", label: "Settings", Icon: Gear },
];

const TITLES: Record<TabId, string> = {
  dash: "Dashboard",
  tables: "Tables",
  categories: "Categories",
  menu: "Menu",
  orders: "Orders",
  bookings: "Bookings",
  settings: "Settings",
};

const SUBTITLES: Record<TabId, string> = {
  dash: "Financial performance for the selected period.",
  tables: "Create, edit and remove the tables guests are seated at.",
  categories: "Group your dishes. Invalid categories stay hidden from the menu.",
  menu: "Every dish, its price and the category it belongs to.",
  orders: "Full order history. Filter, page through and export.",
  bookings: "Today's reservations and how full each slot is.",
  settings: "Tax and currency applied across the workspace.",
};

const ACTION_LABELS: Partial<Record<TabId, string>> = {
  tables: "Add table",
  categories: "Add category",
  menu: "Add dish",
  orders: "New order",
  bookings: "New booking",
};

export function AdminShell() {
  const { workspace, fmt, refreshOrders } = useWorkspace();
  const [tab, setTab] = useState<TabId>("dash");
  const [createSignal, setCreateSignal] = useState(0);

  useNewOrderNotifications(true, refreshOrders, fmt);

  const initials = (workspace.name || "W")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const counts: Partial<Record<TabId, number>> = {
    tables: workspace.tables.length,
    categories: workspace.categories.length,
    menu: workspace.dishes.length,
    bookings: workspace.bookings.filter((b) => b.ts >= startOfToday).length,
  };

  const actionLabel = ACTION_LABELS[tab];

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-58 shrink-0 flex-col gap-7 bg-ink p-3.5 text-white">
        <div className="flex items-center gap-2.5 px-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500">
            <SquaresFour size={15} weight="bold" />
          </span>
          <span className="text-[15px] font-bold tracking-tight">{workspace.name}</span>
        </div>

        <nav className="flex flex-col gap-1">
          <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-widest text-white/40">
            ADMIN
          </p>
          {NAV.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-white/12 font-semibold text-white"
                    : "font-medium text-white/65 hover:text-white",
                )}
              >
                <Icon size={17} weight="bold" />
                <span className="flex-1 text-left">{label}</span>
                {counts[id] !== undefined && (
                  <span
                    className={cn(
                      "min-w-5.5 rounded-full px-1.5 text-[11px] font-bold",
                      active ? "bg-brand-500" : "bg-white/12",
                    )}
                  >
                    {counts[id]}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />
        <Link
          href="/qr-generation"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:text-white"
        >
          <QrCode size={15} weight="bold" />
          Table QR codes
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:text-white"
          >
            <SignOut size={15} weight="bold" />
            Sign out
          </button>
        </form>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-card px-6">
          <h1 className="text-xl font-bold">{TITLES[tab]}</h1>
          <div className="flex-1" />
          {actionLabel && (
            <Button size="sm" onClick={() => setCreateSignal((n) => n + 1)}>
              <Plus size={14} weight="bold" />
              {actionLabel}
            </Button>
          )}
          <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-white">
            {initials}
          </span>
        </header>

        <div className="w-full p-6">
          <p className="mb-5 text-sm text-muted-foreground">{SUBTITLES[tab]}</p>
          {tab === "dash" && <DashboardPanel />}
          {tab === "tables" && <TablesPanel createSignal={createSignal} />}
          {tab === "categories" && <CategoriesPanel createSignal={createSignal} />}
          {tab === "menu" && <MenuPanel createSignal={createSignal} />}
          {tab === "orders" && <OrdersPanel createSignal={createSignal} />}
          {tab === "bookings" && <BookingsPanel createSignal={createSignal} />}
          {tab === "settings" && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
}
