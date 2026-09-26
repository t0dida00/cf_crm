"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { toSession, type OrderSession } from "@/lib/order-math";
import { mapOrder, useWorkspace, type ApiOrder } from "@/components/workspace-provider";

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
 * Refetches whenever the workspace's orders change, i.e. on real-time updates.
 */
export function useOrderHistory({ status, query, page, pageSize }: OrderHistoryParams) {
  const { workspace } = useWorkspace();
  const [result, setResult] = useState<{ sessions: OrderSession[]; total: number }>({
    sessions: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({
      status,
      page: String(page),
      pageSize: String(pageSize),
      ...(query ? { q: query } : {}),
    });
    apiFetch<{ sessions: ApiOrder[][]; total: number }>(`/orders/history?${params}`)
      .then((res) => {
        if (cancelled) return;
        setResult({
          sessions: res.sessions.map((orders) => toSession(orders.map(mapOrder))),
          total: res.total,
        });
      })
      .catch(() => {
        if (!cancelled) setResult({ sessions: [], total: 0 });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, query, page, pageSize, workspace.orders]);

  return { ...result, loading };
}
