"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { mapOrder, useWorkspace, type ApiOrder } from "@/components/workspace-provider";
import type { Order } from "@/lib/types";

export interface OrderStats {
  orderCount: number;
  takings: number;
  recent: Order[];
  bestsellers: { itemId: string; name: string; qty: number; takings: number }[];
  oldestTs: number | null;
}

const EMPTY: OrderStats = { orderCount: 0, takings: 0, recent: [], bestsellers: [], oldestTs: null };

/** Dashboard figures for orders placed within [lo, hi] (epoch ms; ±Infinity =
 * unbounded), aggregated by the backend over the full order history.
 * Refetches whenever the workspace's orders change. */
export function useOrderStats(lo: number, hi: number) {
  const { workspace } = useWorkspace();
  const [stats, setStats] = useState<OrderStats>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      ...(Number.isFinite(lo) ? { from: String(lo) } : {}),
      ...(Number.isFinite(hi) ? { to: String(hi) } : {}),
    });
    apiFetch<Omit<OrderStats, "recent" | "oldestTs"> & { recent: ApiOrder[]; oldestTs: string | null }>(
      `/orders/stats?${params}`,
    )
      .then((res) => {
        if (cancelled) return;
        setStats({
          ...res,
          recent: res.recent.map(mapOrder),
          oldestTs: res.oldestTs ? new Date(res.oldestTs).getTime() : null,
        });
      })
      .catch(() => {
        if (!cancelled) setStats(EMPTY);
      });
    return () => {
      cancelled = true;
    };
  }, [lo, hi, workspace.orders]);

  return stats;
}
