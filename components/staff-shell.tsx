"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BellRinging,
  CalendarCheck,
  CaretLineLeft,
  CaretLineRight,
  ClockCounterClockwise,
  Database,
  ForkKnife,
  Plus,
  Receipt,
  SignOut,
  SquaresFour,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useWorkspace } from "@/components/workspace-provider";
import { StaffMenuPanel } from "@/components/panels/staff/staff-menu-panel";
import { StaffOrdersPanel } from "@/components/panels/staff/staff-orders-panel";
import { BookingsPanel } from "@/components/panels/bookings-panel";
import { Button } from "@/components/ui/button";
import { StaffTablesPanel } from "@/components/panels/staff/staff-tables-panel";
import { StaffHistoryPanel } from "@/components/panels/staff/staff-history-panel";
import { TableRequestsModal } from "@/components/panels/staff/table-requests-modal";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions";
import { apiFetch } from "@/lib/api";
import { errorMessage, toRequestStatus } from "@/lib/request-status";
import { useNewOrderNotifications } from "@/hooks/use-new-order-notifications";
import { useTableRequestNotifications } from "@/hooks/use-table-request-notifications";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import type { TableRequest, TableRequestType } from "@/lib/types";
import { MobileNavDrawer, SkipToContent } from "@/components/mobile-nav-drawer";

const PENDING_REQUESTS_KEY = ["table-requests", "pending"] as const;

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

/** Shared by the static icon rail and the mobile drawer overlay, so the two
 * never drift out of sync — only `collapsed` and container styling differ
 * between them. */
function SidebarBody({
  collapsed,
  workspaceName,
  databaseName,
  workspaceLogoUrl,
  tab,
  setTab,
  counts,
  clock,
  onToggle,
}: {
  collapsed: boolean;
  workspaceName: string;
  /** The business's own database name; null = the shared database. */
  databaseName: string | null;
  workspaceLogoUrl?: string | null;
  tab: StaffTab;
  setTab: (next: StaffTab) => void;
  counts: Record<StaffTab, number>;
  clock: string;
  onToggle: () => void;
}) {
  return (
    <>
      <div className={cn("flex gap-2.5", collapsed ? "items-center justify-center px-0" : "items-start px-2")}>
        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-500">
          {workspaceLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={workspaceLogoUrl} alt="" className="size-full object-cover" />
          ) : (
            <ForkKnife size={15} weight="bold" />
          )}
        </span>
        {!collapsed && (
          // Long names wrap onto as many lines as they need instead of being cut off.
          <span className="min-w-0 flex-1 pt-0.5 text-[15px] leading-snug font-bold tracking-tight [overflow-wrap:anywhere]">
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
          <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-widest text-white/60">
            STAFF
          </p>
        )}
        {/* The business's database, styled like a tab row but not clickable. */}
        {/* <div
          title={databaseName ? `Database: ${databaseName}` : "Using the shared database"}
          aria-label={collapsed ? (databaseName ? `Database: ${databaseName}` : "Using the shared database") : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-lg py-2.5 text-sm font-bold text-white/65",
            collapsed ? "justify-center px-0" : "px-3",
          )}
        >
          <Database size={17} weight="bold" className="shrink-0" />
          {!collapsed && <span className="min-w-0 flex-1 [overflow-wrap:anywhere] text-white">{databaseName ?? "Shared database"}</span>}
        </div> */}
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
                  <span
                    className={cn(
                      "min-w-5.5 rounded-full px-1.5 text-center text-[11px] font-bold",
                      active ? "bg-brand-700" : "bg-white/12",
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

export function StaffShell() {
  const { workspace, fmt, refreshOrders } = useWorkspace();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: StaffTab = isStaffTab(tabParam) ? tabParam : "orders";
  const [now, setNow] = useState(() => Date.now());
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);
  const { collapsed, isNarrow, mobileOpen, closeMobile, toggle: toggleCollapsed } =
    useSidebarCollapse();

  const setTab = (next: StaffTab) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    // Tabs are the same page: update the URL without a server round-trip
    // (router.replace would wait on the server before the tab changes).
    window.history.replaceState(null, "", `/staff?${params.toString()}`);
  };

  useEffect(() => {
    if (!isStaffTab(tabParam)) {
      const params = new URLSearchParams(searchParams);
      params.set("tab", "orders");
      window.history.replaceState(null, "", `/staff?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const queryClient = useQueryClient();
  const [createSignal, setCreateSignal] = useState(0);
  const requestsQuery = useQuery({
    queryKey: PENDING_REQUESTS_KEY,
    queryFn: async ({ signal }) => {
      const res = await apiFetch<{ requests: ApiTableRequest[] }>("/table-requests?status=pending", { signal });
      return res.requests.map(mapRequest);
    },
  });
  const pendingRequests = requestsQuery.data ?? [];
  const refreshRequests = () => void requestsQuery.refetch();

  useNewOrderNotifications(
    true,
    workspace.id,
    refreshOrders,
    fmt,
    workspace.orders,
    () => setTab("orders"),
    workspace.pusher,
  );
  useTableRequestNotifications(
    true,
    workspace.id,
    () => {
      refreshRequests();
      setRequestsModalOpen(true);
    },
    workspace.pusher,
  );

  const handleResolveRequest = async (id: string) => {
    await apiFetch(`/table-requests/${id}/resolve`, { method: "POST" });
    queryClient.setQueryData<TableRequest[]>(PENDING_REQUESTS_KEY, (prev) =>
      prev?.filter((r) => r.id !== id),
    );
  };


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
      <SkipToContent />
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col gap-7 bg-ink p-3.5 text-white transition-[width] duration-200",
          collapsed ? "w-16" : "w-58",
        )}
      >
        <SidebarBody
          collapsed={collapsed}
          workspaceName={workspace.name}
          databaseName={workspace.databaseName ?? null}
          workspaceLogoUrl={workspace.logoUrl}
          tab={tab}
          setTab={setTab}
          counts={counts}
          clock={clock}
          onToggle={toggleCollapsed}
        />
      </aside>

      <MobileNavDrawer open={isNarrow && mobileOpen} onClose={closeMobile}>
        <SidebarBody
          collapsed={false}
          workspaceName={workspace.name}
          databaseName={workspace.databaseName ?? null}
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
      </MobileNavDrawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card px-4 md:gap-4 md:px-6">
          <Link href="/" aria-label="Tably home" className="flex shrink-0 items-center gap-2">
            <span className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md">
              <Image src="/icons/bell_master.png" alt="" fill sizes="24px" className="object-cover" />
            </span>
            <span className="hidden text-sm font-bold tracking-tight sm:inline">Tably</span>
          </Link>
          <div className="h-5 w-px shrink-0 bg-border" />
          <h1 className="min-w-0 flex-1 truncate text-xl font-bold sm:flex-initial">
            {TITLES[tab]}
          </h1>
          <div className="hidden flex-1 sm:block" />
          {tab === "bookings" && (
            <Button
              size="sm"
              onClick={() => setCreateSignal((n) => n + 1)}
              aria-label="New booking"
              className="shrink-0"
            >
              <Plus size={14} weight="bold" />
              <span className="hidden sm:inline">New booking</span>
            </Button>
          )}
          <button
            type="button"
            onClick={() => setRequestsModalOpen(true)}
            className="relative flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Table requests"
          >
            <BellRinging size={18} weight="bold" />
            {pendingRequests.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-brand-700 text-[10px] font-bold text-white">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </header>

        <div id="main-content" role="main" tabIndex={-1} className="w-full flex-1 p-4 outline-none md:p-6">
          {tab === "menu" && <StaffMenuPanel />}
          {tab === "orders" && <StaffOrdersPanel />}
          {tab === "bookings" && <BookingsPanel createSignal={createSignal} allowTableAssign />}
          {tab === "tables" && <StaffTablesPanel />}
          {tab === "history" && <StaffHistoryPanel />}
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

      <TableRequestsModal
        open={requestsModalOpen}
        onOpenChange={setRequestsModalOpen}
        requests={pendingRequests}
        status={requestsQuery.isFetching ? "loading" : toRequestStatus(requestsQuery)}
        error={
          requestsQuery.isError ? errorMessage(requestsQuery.error, "Couldn't load table requests.") : null
        }
        onRetry={refreshRequests}
        onResolve={handleResolveRequest}
      />
    </div>
  );
}
