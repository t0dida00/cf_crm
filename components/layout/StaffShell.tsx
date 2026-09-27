"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BellRinging,
  CalendarCheck,
  ClockCounterClockwise,
  ForkKnife,
  Receipt,
  SquaresFour,
} from "@phosphor-icons/react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { StaffMenuPanel } from "@/components/staff/StaffMenuPanel";
import { StaffOrdersPanel } from "@/components/staff/StaffOrdersPanel";
import { BookingsPanel } from "@/components/bookings/BookingsPanel";
import { StaffTablesPanel } from "@/components/staff/StaffTablesPanel";
import { StaffHistoryPanel } from "@/components/staff/StaffHistoryPanel";
import { TableRequestsModal } from "@/components/staff/TableRequestsModal";
import { apiFetch } from "@/lib/api";
import { errorMessage, toRequestStatus } from "@/lib/requestStatus";
import { useNewOrderNotifications } from "@/hooks/useNewOrderNotifications";
import { useTableRequestNotifications } from "@/hooks/useTableRequestNotifications";
import type { TableRequest, TableRequestType } from "@/lib/types";
import { AppShell, HeaderActionButton, useShellTab, type NavItem } from "./AppShell";

const PENDING_REQUESTS_KEY = ["table-requests", "pending"] as const;

type StaffTab = "menu" | "orders" | "bookings" | "tables" | "history";

const NAV: NavItem<StaffTab>[] = [
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

/** The staff floor app: the shared AppShell with the staff tabs, plus table requests. */
export function StaffShell() {
  const { workspace, fmt } = useWorkspace();
  const { tab, setTab } = useShellTab({ basePath: "/staff", ids: TAB_IDS, fallback: "orders", titles: TITLES, area: "Staff" });
  const [requestsModalOpen, setRequestsModalOpen] = useState(false);
  const [createSignal, setCreateSignal] = useState(0);

  const queryClient = useQueryClient();
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
    undefined, // WorkspaceProvider applies the order itself
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
    queryClient.setQueryData<TableRequest[]>(PENDING_REQUESTS_KEY, (prev) => prev?.filter((r) => r.id !== id));
  };

  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const counts: Record<StaffTab, number> = {
    menu: workspace.dishes.length,
    orders: workspace.orders.filter((o) => !o.closedTs).length,
    bookings: workspace.bookings.filter((b) => b.ts >= startOfToday).length,
    tables: workspace.tables.filter((t) => t.state === "Free").length,
    history: workspace.orders.filter((o) => o.closedTs).length,
  };

  return (
    <AppShell
      section="STAFF"
      logoFallback={ForkKnife}
      nav={NAV}
      tab={tab}
      onTabChange={setTab}
      counts={counts}
      title={TITLES[tab]}
      actions={
        <>
          {tab === "bookings" && (
            <HeaderActionButton label="New booking" onClick={() => setCreateSignal((n) => n + 1)} />
          )}
          <button
            type="button"
            onClick={() => setRequestsModalOpen(true)}
            className="relative flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={pendingRequests.length ? `Table requests, ${pendingRequests.length} waiting` : "Table requests"}
          >
            <BellRinging size={18} weight="bold" aria-hidden />
            {pendingRequests.length > 0 && (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-brand-700 text-[10px] font-bold text-white"
              >
                {pendingRequests.length}
              </span>
            )}
          </button>
        </>
      }
      overlays={
        <TableRequestsModal
          open={requestsModalOpen}
          onOpenChange={setRequestsModalOpen}
          requests={pendingRequests}
          status={requestsQuery.isFetching ? "loading" : toRequestStatus(requestsQuery)}
          error={requestsQuery.isError ? errorMessage(requestsQuery.error, "Couldn't load table requests.") : null}
          onRetry={refreshRequests}
          onResolve={handleResolveRequest}
        />
      }
    >
      {tab === "menu" && <StaffMenuPanel />}
      {tab === "orders" && <StaffOrdersPanel />}
      {tab === "bookings" && <BookingsPanel createSignal={createSignal} allowTableAssign />}
      {tab === "tables" && <StaffTablesPanel />}
      {tab === "history" && <StaffHistoryPanel />}
    </AppShell>
  );
}
