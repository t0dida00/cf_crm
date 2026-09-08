"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

const POLL_INTERVAL_MS = 2000;

interface ApiOrderSummary {
  id: string;
  code: string;
  table_name: string;
  total: string | number;
  ts: string;
}

/** Polls for orders placed from other sessions (e.g. the customer-facing /client flow)
 * and toasts once per newly-seen order id. `onNewOrder` lets the caller refresh its
 * own order list so counts/panels stay in sync with what triggered the toast. */
export function useNewOrderNotifications(
  enabled: boolean,
  onNewOrder: () => void,
  fmt: (value: number) => string,
) {
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await apiFetch<{ orders: ApiOrderSummary[] }>("/orders?open=true");
        if (cancelled) return;

        if (seenIds.current === null) {
          seenIds.current = new Set(res.orders.map((o) => o.id));
          return;
        }

        const newOrders = res.orders.filter((o) => !seenIds.current!.has(o.id));
        for (const order of res.orders) seenIds.current.add(order.id);

        if (newOrders.length > 0) {
          for (const order of newOrders) {
            toast(`New order ${order.code}`, {
              description: `${order.table_name} · ${fmt(Number(order.total))}`,
            });
          }
          onNewOrder();
        }
      } catch {
        // Transient network/backend hiccups shouldn't spam the UI; next poll retries.
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
