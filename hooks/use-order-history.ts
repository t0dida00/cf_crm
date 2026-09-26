"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toSession } from "@/lib/order-math";
import { errorMessage, toRequestStatus } from "@/lib/request-status";
import { mapOrder, type ApiOrder } from "@/components/workspace-provider";

interface OrderHistoryParams {
  /** "closed" = checked-out sessions only; "all" also lists each open order. */
  status: "closed" | "all";
  query: string;
  page: number;
  pageSize: number;
}

/**
 * One page of order history, grouped into sessions and paginated by the
 * backend (`GET /orders/history`) — the workspace's order list only holds
 * recent history, so browsing or searching all of it has to go to the server.
 * The previous page stays on screen while the next one loads. Cached under
 * ["orders", …], which the workspace provider invalidates on order updates.
 */
export function useOrderHistory({ status, query, page, pageSize }: OrderHistoryParams) {
  const result = useQuery({
    queryKey: ["orders", "history", { status, query, page, pageSize }],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        status,
        page: String(page),
        pageSize: String(pageSize),
        ...(query ? { q: query } : {}),
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
    error: result.isError ? errorMessage(result.error, "Couldn't load orders.") : null,
    retry: () => void result.refetch(),
  };
}
