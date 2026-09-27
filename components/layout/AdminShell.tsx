"use client";

import { useState } from "react";
import {
  CalendarCheck,
  ChartBar,
  Folders,
  ForkKnife,
  Gear,
  QrCode,
  Receipt,
  SquaresFour,
  Users,
} from "@phosphor-icons/react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { DashboardPanel } from "@/components/admin/DashboardPanel";
import { TablesPanel } from "@/components/admin/TablesPanel";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { MenuPanel } from "@/components/admin/MenuPanel";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import { BookingsPanel } from "@/components/bookings/BookingsPanel";
import { StaffPanel } from "@/components/admin/StaffPanel";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { ConnectionsPanel } from "@/components/admin/ConnectionsPanel";
import { QrPanel } from "@/components/admin/QrPanel";
import type { TabId } from "@/lib/types";
import { useNewOrderNotifications } from "@/hooks/useNewOrderNotifications";
import { AppShell, HeaderActionButton, useShellTab, type NavItem } from "./AppShell";

const NAV: NavItem<TabId>[] = [
  { id: "dash", label: "Dashboard", Icon: ChartBar },
  { id: "tables", label: "Tables", Icon: SquaresFour },
  { id: "categories", label: "Categories", Icon: Folders },
  { id: "menu", label: "Menu", Icon: ForkKnife },
  { id: "orders", label: "Orders", Icon: Receipt },
  { id: "bookings", label: "Bookings", Icon: CalendarCheck },
  { id: "staff", label: "Staffs", Icon: Users },
  { id: "qr", label: "Table QR codes", Icon: QrCode },
  { id: "settings", label: "Settings", Icon: Gear },
];

const TITLES: Record<TabId, string> = {
  dash: "Dashboard",
  tables: "Tables",
  categories: "Categories",
  menu: "Menu",
  orders: "Orders",
  bookings: "Bookings",
  staff: "Staffs",
  settings: "Settings",
  qr: "Table QR codes",
};

const SUBTITLES: Record<TabId, string> = {
  dash: "Financial performance for the selected period.",
  tables: "Create, edit and remove the tables guests are seated at.",
  categories: "Group your dishes. Invalid categories stay hidden from the menu.",
  menu: "Every dish, its price and the category it belongs to.",
  orders: "Full order history. Filter, page through and export.",
  bookings: "Pick a day on the calendar to see its reservations.",
  staff: "Staff accounts for this workspace. Disable an account to revoke access.",
  settings: "Tax and currency applied across the workspace.",
  qr: "Print one of these per table. Scanning opens the menu for that exact table — no app or login needed.",
};

const ACTION_LABELS: Partial<Record<TabId, string>> = {
  tables: "Add table",
  categories: "Add category",
  menu: "Add dish",
  // orders: "New order",
  bookings: "New booking",
  staff: "Add staff",
};

const TAB_IDS: TabId[] = NAV.map((n) => n.id);

/** The owner's admin app: the shared AppShell with the admin tabs. */
export function AdminShell() {
  const { workspace, fmt } = useWorkspace();
  const { tab, setTab } = useShellTab({ basePath: "/admin", ids: TAB_IDS, fallback: "dash", titles: TITLES, area: "Admin" });
  const [createSignal, setCreateSignal] = useState(0);

  useNewOrderNotifications(true, workspace.id, undefined, fmt, workspace.orders, undefined, workspace.pusher);

  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const counts: Partial<Record<TabId, number>> = {
    tables: workspace.tables.length,
    categories: workspace.categories.length,
    menu: workspace.dishes.length,
    bookings: workspace.bookings.filter((b) => b.ts >= startOfToday).length,
  };
  const actionLabel = ACTION_LABELS[tab];

  return (
    <AppShell
      section="ADMIN"
      logoFallback={SquaresFour}
      showDatabase
      nav={NAV}
      tab={tab}
      onTabChange={(next) => {
        setCreateSignal(0);
        setTab(next);
      }}
      counts={counts}
      title={TITLES[tab]}
      actions={actionLabel && <HeaderActionButton label={actionLabel} onClick={() => setCreateSignal((n) => n + 1)} />}
    >
      <p className="mb-5 text-sm text-muted-foreground">{SUBTITLES[tab]}</p>
      {tab === "dash" && <DashboardPanel />}
      {tab === "tables" && <TablesPanel createSignal={createSignal} />}
      {tab === "categories" && <CategoriesPanel createSignal={createSignal} />}
      {tab === "menu" && <MenuPanel createSignal={createSignal} />}
      {tab === "orders" && <OrdersPanel createSignal={createSignal} />}
      {tab === "bookings" && <BookingsPanel createSignal={createSignal} />}
      {tab === "staff" && <StaffPanel createSignal={createSignal} />}
      {tab === "settings" && (
        // Side by side on desktop, stacked below xl.
        <div className="grid items-start gap-4 xl:grid-cols-2">
          <SettingsPanel />
          <ConnectionsPanel />
        </div>
      )}
      {tab === "qr" && <QrPanel />}
    </AppShell>
  );
}
