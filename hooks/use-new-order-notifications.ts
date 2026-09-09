"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/notification-sound";
import { usePlatformSocket } from "@/hooks/use-platform-socket";

interface ApiOrder {
  id: string;
  code: string;
  table_name: string;
  total: string | number;
}

/** Live-updates on orders placed or added to from other sessions (e.g. the
 * customer-facing /client flow). Toasts on order:created, and on
 * order:updated only when the total actually changed (new items) — a plain
 * status advance (e.g. staff moving a card along the flow) touches the same
 * event but not the total, and shouldn't toast "new order" for that.
 * `onNewOrder` lets the caller refresh its own order list so counts/panels
 * stay in sync with what triggered the toast. */
export function useNewOrderNotifications(
  enabled: boolean,
  platformId: string | null,
  onNewOrder: () => void,
  fmt: (value: number) => string,
) {
  const channel = usePlatformSocket(enabled ? platformId : null);
  const lastTotals = useRef(new Map<string, number>());

  useEffect(() => {
    if (!channel) return;

    const notify = (order: ApiOrder) => {
      toast(`New order ${order.code}`, {
        description: `${order.table_name} · ${fmt(Number(order.total))}`,
      });
      playNotificationSound();
      onNewOrder();
    };

    const onCreated = ({ order }: { order: ApiOrder }) => {
      lastTotals.current.set(order.id, Number(order.total));
      notify(order);
    };
    const onUpdated = ({ order }: { order: ApiOrder }) => {
      const total = Number(order.total);
      const changed = lastTotals.current.get(order.id) !== total;
      lastTotals.current.set(order.id, total);
      if (changed) notify(order);
      else onNewOrder();
    };

    channel.bind("order:created", onCreated);
    channel.bind("order:updated", onUpdated);
    return () => {
      channel.unbind("order:created", onCreated);
      channel.unbind("order:updated", onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);
}
