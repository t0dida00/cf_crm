"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { errorMessage, toRequestStatus } from "@/lib/request-status";
import { mapOrder, type ApiOrder } from "@/components/workspace-provider";
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
 * unbounded), aggregated by the backend over the full order history. */
export function useOrderStats(lo: number, hi: number) {
  const from = Number.isFinite(lo) ? lo : null;
  const to = Number.isFinite(hi) ? hi : null;
  const result = useQuery({
    queryKey: ["orders", "stats", { from, to }],
    queryFn: async (): Promise<OrderStats> => {
      const params = new URLSearchParams({
        ...(from !== null ? { from: String(from) } : {}),
        ...(to !== null ? { to: String(to) } : {}),
      });
      const res = await apiFetch<
        Omit<OrderStats, "recent" | "oldestTs"> & { recent: ApiOrder[]; oldestTs: string | null }
      >(`/orders/stats?${params}`);
      return {
        ...res,
        recent: res.recent.map(mapOrder),
        oldestTs: res.oldestTs ? new Date(res.oldestTs).getTime() : null,
      };
    },
    placeholderData: keepPreviousData,
  });

  return {
    stats: result.data ?? EMPTY,
    status: result.isFetching ? "loading" as const : toRequestStatus(result),
    error: result.isError ? errorMessage(result.error, "Couldn't load dashboard figures.") : null,
    retry: () => void result.refetch(),
  };
}
