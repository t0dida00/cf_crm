"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarCheck,
  CaretLineLeft,
  CaretLineRight,
  ChartBar,
  Folders,
  ForkKnife,
  Gear,
  Plus,
  QrCode,
  Receipt,
  SignOut,
  SquaresFour,
  Users,
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
import { StaffPanel } from "@/components/panels/staff-panel";
import { SettingsPanel } from "@/components/panels/settings-panel";
import type { TabId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useNewOrderNotifications } from "@/hooks/use-new-order-notifications";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";

const NAV: { id: TabId; label: string; Icon: PhosphorIcon }[] = [
  { id: "dash", label: "Dashboard", Icon: ChartBar },
  { id: "tables", label: "Tables", Icon: SquaresFour },
  { id: "categories", label: "Categories", Icon: Folders },
  { id: "menu", label: "Menu", Icon: ForkKnife },
  { id: "orders", label: "Orders", Icon: Receipt },
  { id: "bookings", label: "Bookings", Icon: CalendarCheck },
  { id: "staff", label: "Staffs", Icon: Users },
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
};

const SUBTITLES: Record<TabId, string> = {
  dash: "Financial performance for the selected period.",
  tables: "Create, edit and remove the tables guests are seated at.",
  categories: "Group your dishes. Invalid categories stay hidden from the menu.",
  menu: "Every dish, its price and the category it belongs to.",
  orders: "Full order history. Filter, page through and export.",
  bookings: "Today's reservations and how full each slot is.",
  staff: "Staff accounts for this workspace. Disable an account to revoke access.",
  settings: "Tax and currency applied across the workspace.",
};

const ACTION_LABELS: Partial<Record<TabId, string>> = {
  tables: "Add table",
  categories: "Add category",
  menu: "Add dish",
  // orders: "New order",
  bookings: "New booking",
  staff: "Add staff",
};

const TAB_IDS = NAV.map((n) => n.id);
const isTabId = (value: string | null): value is TabId =>
  value !== null && (TAB_IDS as string[]).includes(value);

/** Shared by the static icon rail and the mobile drawer overlay, so the two
 * never drift out of sync — only `collapsed` and container styling differ
 * between them. */
function SidebarBody({
  collapsed,
  workspaceName,
  workspaceLogoUrl,
  tab,
  setTab,
  counts,
  clock,
  onToggle,
}: {
  collapsed: boolean;
  workspaceName: string;
  workspaceLogoUrl?: string | null;
  tab: TabId;
  setTab: (next: TabId) => void;
  counts: Partial<Record<TabId, number>>;
  clock: string;
  onToggle: () => void;
}) {
  return (
    <>
      <div className={cn("flex items-center gap-2.5", collapsed ? "justify-center px-0" : "px-2")}>
        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-500">
          {workspaceLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={workspaceLogoUrl} alt="" className="size-full object-cover" />
          ) : (
            <SquaresFour size={15} weight="bold" />
          )}
        </span>
        {!collapsed && (
          <span className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight">
            {workspaceName}
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-white/55 transition-colors hover:text-white"
        >
          {collapsed ? (
            <CaretLineRight size={15} weight="bold" />
          ) : (
            <CaretLineLeft size={15} weight="bold" />
          )}
        </button>
      </div>
      {!collapsed && <div className="px-2 text-[13px] text-white/55">{clock}</div>}

      <nav className="flex flex-col gap-1">
        {!collapsed && (
          <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-widest text-white/40">
            ADMIN
          </p>
        )}
        {NAV.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg py-2.5 text-sm transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                active
                  ? "bg-white/12 font-semibold text-white"
                  : "font-medium text-white/65 hover:text-white",
              )}
            >
              <Icon size={17} weight="bold" />
              {!collapsed && (
                <>
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
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />
      <Link
        href="/qr-generation"
        title={collapsed ? "Table QR codes" : undefined}
        aria-label={collapsed ? "Table QR codes" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-lg py-2.5 text-sm font-medium text-white/55 transition-colors hover:text-white",
          collapsed ? "justify-center px-0" : "px-3",
        )}
      >
        <QrCode size={15} weight="bold" />
        {!collapsed && "Table QR codes"}
      </Link>
      <form action={signOutAction}>
        <button
          type="submit"
          title={collapsed ? "Sign out" : undefined}
          aria-label={collapsed ? "Sign out" : undefined}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg py-2.5 text-sm font-medium text-white/55 transition-colors hover:text-white",
            collapsed ? "justify-center px-0" : "px-3",
          )}
        >
          <SignOut size={15} weight="bold" />
          {!collapsed && "Sign out"}
        </button>
      </form>
    </>
  );
}

export function AdminShell() {
  const { workspace, fmt, refreshOrders } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: TabId = isTabId(tabParam) ? tabParam : "dash";
  const [createSignal, setCreateSignal] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const { collapsed, isNarrow, mobileOpen, closeMobile, toggle: toggleCollapsed } =
    useSidebarCollapse();

  const setTab = (next: TabId) => {
    setCreateSignal(0);
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!isTabId(tabParam)) {
      const params = new URLSearchParams(searchParams);
      params.set("tab", "dash");
      router.replace(`/admin?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  useNewOrderNotifications(true, workspace.id, refreshOrders, fmt, workspace.orders);

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

  const clock =
    new Date(now).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }) +
    " · " +
    new Date(now).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col gap-7 bg-ink p-3.5 text-white transition-[width] duration-200",
          collapsed ? "w-16" : "w-58",
        )}
      >
        <SidebarBody
          collapsed={collapsed}
          workspaceName={workspace.name}
          workspaceLogoUrl={workspace.logoUrl}
          tab={tab}
          setTab={setTab}
          counts={counts}
          clock={clock}
          onToggle={toggleCollapsed}
        />
      </aside>

      {isNarrow && mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-58 flex-col gap-7 bg-ink p-3.5 text-white">
            <SidebarBody
              collapsed={false}
              workspaceName={workspace.name}
              workspaceLogoUrl={workspace.logoUrl}
              tab={tab}
              setTab={(next) => {
                setTab(next);
                closeMobile();
              }}
              counts={counts}
              clock={clock}
              onToggle={closeMobile}
            />
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card px-4 md:gap-4 md:px-6">
          <Link href="/" aria-label="Tably home" className="flex shrink-0 items-center gap-2">
            <span className="flex size-6 items-center justify-center overflow-hidden rounded-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/bell_master.png" alt="" className="size-full object-cover" />
            </span>
            <span className="hidden text-sm font-bold tracking-tight sm:inline">Tably</span>
          </Link>
          <div className="h-5 w-px shrink-0 bg-border" />
          <h1 className="min-w-0 flex-1 truncate text-xl font-bold sm:flex-initial">
            {TITLES[tab]}
          </h1>
          <div className="hidden flex-1 sm:block" />
          {actionLabel && (
            <Button
              size="sm"
              onClick={() => setCreateSignal((n) => n + 1)}
              aria-label={actionLabel}
              className="shrink-0"
            >
              <Plus size={14} weight="bold" />
              <span className="hidden sm:inline">{actionLabel}</span>
            </Button>
          )}
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-white">
            {initials}
          </span>
        </header>

        <div className="w-full flex-1 p-4 md:p-6">
          <p className="mb-5 text-sm text-muted-foreground">{SUBTITLES[tab]}</p>
          {tab === "dash" && <DashboardPanel />}
          {tab === "tables" && <TablesPanel createSignal={createSignal} />}
          {tab === "categories" && <CategoriesPanel createSignal={createSignal} />}
          {tab === "menu" && <MenuPanel createSignal={createSignal} />}
          {tab === "orders" && <OrdersPanel createSignal={createSignal} />}
          {tab === "bookings" && <BookingsPanel createSignal={createSignal} />}
          {tab === "staff" && <StaffPanel createSignal={createSignal} />}
          {tab === "settings" && <SettingsPanel />}
        </div>

        <footer className="border-t bg-card px-4 py-4 text-xs text-muted-foreground md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} Tably. All rights reserved.</span>
            <Link href="/instruction" className="hover:text-foreground hover:underline">
              How Tably works
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
