"use client";

import { t } from "@/lib/i18n";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toSession } from "@/lib/orderMath";
import { errorMessage, toRequestStatus } from "@/lib/requestStatus";
import { mapOrder, type ApiOrder } from "@/components/providers/WorkspaceProvider";

interface OrderHistoryParams {
  /** "closed" = checked-out sessions only; "all" also lists each open order. */
  status: "closed" | "all";
  query: string;
  page: number;
  pageSize: number;
  /** Only sessions checked out since this time (ms); omit for all history. */
  from?: number;
}

/**
 * One page of order history, grouped into sessions and paginated by the
 * backend (`GET /orders/history`) — the workspace's order list only holds
 * recent history, so browsing or searching all of it has to go to the server.
 * The previous page stays on screen while the next one loads. Cached under
 * ["orders", …], which the workspace provider invalidates on order updates.
 */
export function useOrderHistory({ status, query, page, pageSize, from }: OrderHistoryParams) {
  const result = useQuery({
    queryKey: ["orders", "history", { status, query, page, pageSize, from }],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        status,
        page: String(page),
        pageSize: String(pageSize),
        ...(query ? { q: query } : {}),
        ...(from !== undefined ? { from: String(from) } : {}),
      });
      const res = await apiFetch<{ sessions: ApiOrder[][]; total: number }>(
        `/orders/history?${params}`,
        { signal },
      );
      return {
        sessions: res.sessions.map((orders) => toSession(orders.map(mapOrder))),
        total: res.total,
      };
    },
    placeholderData: keepPreviousData,
  });

  return {
    sessions: result.data?.sessions ?? [],
    total: result.data?.total ?? 0,
    status: result.isFetching ? "loading" as const : toRequestStatus(result),
    error: result.isError ? errorMessage(result.error, t("errors.orders")) : null,
    retry: () => void result.refetch(),
  };
}
