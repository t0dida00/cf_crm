"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BellRinging,
  CalendarCheck,
  CaretLineLeft,
  CaretLineRight,
  ClockCounterClockwise,
  ForkKnife,
  Receipt,
  SignOut,
  SquaresFour,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useWorkspace } from "@/components/workspace-provider";
import { StaffMenuPanel } from "@/components/panels/staff/staff-menu-panel";
import { StaffOrdersPanel } from "@/components/panels/staff/staff-orders-panel";
import { StaffBookingsPanel } from "@/components/panels/staff/staff-bookings-panel";
import { StaffTablesPanel } from "@/components/panels/staff/staff-tables-panel";
import { StaffHistoryPanel } from "@/components/panels/staff/staff-history-panel";
import { TableRequestsModal } from "@/components/panels/staff/table-requests-modal";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions";
import { apiFetch } from "@/lib/api";
import { useNewOrderNotifications } from "@/hooks/use-new-order-notifications";
import { useTableRequestNotifications } from "@/hooks/use-table-request-notifications";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import type { TableRequest, TableRequestType } from "@/lib/types";

type StaffTab = "menu" | "orders" | "bookings" | "tables" | "history";

const NAV: { id: StaffTab; label: string; Icon: PhosphorIcon }[] = [
  { id: "orders", label: "Orders", Icon: Receipt },
  { id: "tables", label: "Tables", Icon: SquaresFour },
  { id: "bookings", label: "Bookings", Icon: CalendarCheck },
  { id: "menu", label: "Menu", Icon: ForkKnife },
  { id: "history", label: "History", Icon: ClockCounterClockwise },
];

const TITLES: Record<StaffTab, string> = {
  menu: "Menu",
  orders: "Orders",
  bookings: "Bookings",
  tables: "Tables",
  history: "History",
};

const TAB_IDS = NAV.map((n) => n.id);
const isStaffTab = (value: string | null): value is StaffTab =>
  value !== null && (TAB_IDS as string[]).includes(value);

interface ApiTableRequest {
  id: string;
  table_name: string;
  type: TableRequestType;
  status: "pending" | "resolved";
  created_at: string;
  resolved_at: string | null;
}

const mapRequest = (r: ApiTableRequest): TableRequest => ({
  id: r.id,
  tableName: r.table_name,
  type: r.type,
  status: r.status,
  ts: new Date(r.created_at).getTime(),
  resolvedTs: r.resolved_at ? new Date(r.resolved_at).getTime() : null,
});

export function StaffShell() {
  const { workspace, fmt, refreshOrders } = useWorkspace();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: StaffTab = isStaffTab(tabParam) ? tabParam : "orders";
  const [now, setNow] = useState(() => Date.now());
  const [pendingRequests, setPendingRequests] = useState<TableRequest[]>([]);
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);
  const { collapsed, toggle: toggleCollapsed } = useSidebarCollapse();

  const setTab = (next: StaffTab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    router.replace(`/staff?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (!isStaffTab(tabParam)) {
      const params = new URLSearchParams(searchParams);
      params.set("tab", "orders");
      router.replace(`/staff?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const refreshRequests = async () => {
    const res = await apiFetch<{ requests: ApiTableRequest[] }>("/table-requests?status=pending");
    setPendingRequests(res.requests.map(mapRequest));
  };

  useEffect(() => {
    refreshRequests();
  }, []);

  useNewOrderNotifications(true, workspace.id, refreshOrders, fmt);
  useTableRequestNotifications(true, workspace.id, () => {
    refreshRequests();
    setRequestsModalOpen(true);
  });

  const handleResolveRequest = async (id: string) => {
    await apiFetch(`/table-requests/${id}/resolve`, { method: "POST" });
    setPendingRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const initials = (workspace.name || "W")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const openOrders = workspace.orders.filter((o) => !o.closedTs);
  const closedOrders = workspace.orders.filter((o) => o.closedTs);
  const counts: Record<StaffTab, number> = {
    menu: workspace.dishes.length,
    orders: openOrders.length,
    bookings: workspace.bookings.filter((b) => b.ts >= startOfToday).length,
    tables: workspace.tables.filter((t) => t.state === "Free").length,
    history: closedOrders.length,
  };

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
        <div className={cn("flex items-center gap-2.5", collapsed ? "justify-center px-0" : "px-2")}>
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-500">
            <ForkKnife size={15} weight="bold" />
          </span>
          {!collapsed && (
            <span className="min-w-0 flex-1 truncate text-[15px] font-bold tracking-tight">
              {workspace.name}
            </span>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-white/55 transition-colors hover:text-white"
          >
            {collapsed ? (
              <CaretLineRight size={15} weight="bold" />
            ) : (
              <CaretLineLeft size={15} weight="bold" />
            )}
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {!collapsed && (
            <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-widest text-white/40">
              STAFF
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
                    <span
                      className={cn(
                        "min-w-5.5 rounded-full px-1.5 text-center text-[11px] font-bold",
                        active ? "bg-brand-500" : "bg-white/12",
                      )}
                    >
                      {counts[id]}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />
        {!collapsed && <div className="px-3 py-2.5 text-[13px] text-white/55">{clock}</div>}
        <form action={signOutAction}>
          <button
            type="submit"
            title={collapsed ? "Sign out" : undefined}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg py-2.5 text-sm font-medium text-white/55 transition-colors hover:text-white",
              collapsed ? "justify-center px-0" : "px-3",
            )}
          >
            <SignOut size={15} weight="bold" />
            {!collapsed && "Sign out"}
          </button>
        </form>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-card px-6">
          <h1 className="text-xl font-bold">{TITLES[tab]}</h1>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setRequestsModalOpen(true)}
            className="relative flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Table requests"
          >
            <BellRinging size={18} weight="bold" />
            {pendingRequests.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-white">
            {initials}
          </span>
        </header>

        <div className="w-full p-6">
          {tab === "menu" && <StaffMenuPanel />}
          {tab === "orders" && <StaffOrdersPanel />}
          {tab === "bookings" && <StaffBookingsPanel />}
          {tab === "tables" && <StaffTablesPanel />}
          {tab === "history" && <StaffHistoryPanel />}
        </div>
      </div>

      <TableRequestsModal
        open={requestsModalOpen}
        onOpenChange={setRequestsModalOpen}
        requests={pendingRequests}
        onResolve={handleResolveRequest}
      />
    </div>
  );
}
