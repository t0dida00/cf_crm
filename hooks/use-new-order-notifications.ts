"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { playNotificationSound } from "@/lib/notification-sound";

const POLL_INTERVAL_MS = 2000;

interface ApiOrderSummary {
  id: string;
  code: string;
  table_name: string;
  total: string | number;
  ts: string;
}

/** Polls for orders placed or added to from other sessions (e.g. the customer-facing
 * /client flow) and toasts once per order that's new OR whose total changed since the
 * last poll — a table can order multiple times, and repeat rounds merge into the same
 * open order (same id, bigger total), so id-only tracking would miss every round after
 * the first. `onNewOrder` lets the caller refresh its own order list so counts/panels
 * stay in sync with what triggered the toast. */
export function useNewOrderNotifications(
  enabled: boolean,
  onNewOrder: () => void,
  fmt: (value: number) => string,
) {
  const seenTotals = useRef<Map<string, number> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await apiFetch<{ orders: ApiOrderSummary[] }>("/orders?open=true");
        if (cancelled) return;

        if (seenTotals.current === null) {
          seenTotals.current = new Map(res.orders.map((o) => [o.id, Number(o.total)]));
          return;
        }

        const changedOrders = res.orders.filter(
          (o) => seenTotals.current!.get(o.id) !== Number(o.total),
        );
        for (const order of res.orders) seenTotals.current.set(order.id, Number(order.total));

        if (changedOrders.length > 0) {
          for (const order of changedOrders) {
            toast(`New order ${order.code}`, {
              description: `${order.table_name} · ${fmt(Number(order.total))}`,
            });
          }
          playNotificationSound();
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
