"use client";

import { t } from "@/lib/i18n";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/notificationSound";
import { usePlatformSocket } from "./usePlatformSocket";
import type { PusherConfig } from "@/lib/types";

interface ApiOrder {
  id: string;
  code: string;
  table_name: string;
  total: string | number;
}

/** Toasts (and a sound) for orders placed or added to from other sessions
 * (e.g. the customer-facing /client flow): on order:created, and on
 * order:updated only when the total actually changed (new items) — a plain
 * status advance touches the same event but not the total. The order lists
 * themselves are kept current by WorkspaceProvider, which applies each
 * event's order; `onNewOrder` is only for extra work on a new order.
 * `knownOrders` seeds the last-known total for orders already on screen when
 * this mounts — without it, the first order:updated event for any
 * already-open order (e.g. a plain status advance right after page load)
 * looks like a total change, since there's nothing to compare against yet,
 * and wrongly toasts "New order" for an order staff already has open. */
export function useNewOrderNotifications(
  enabled: boolean,
  platformId: string | null,
  onNewOrder: (() => void) | undefined,
  fmt: (value: number) => string,
  knownOrders?: { id: string; total: number }[],
  onToastClick?: () => void,
  pusher?: PusherConfig | null,
) {
  const channel = usePlatformSocket(enabled ? platformId : null, pusher);
  const lastTotals = useRef(new Map<string, number>());

  useEffect(() => {
    if (!knownOrders) return;
    for (const order of knownOrders) {
      if (!lastTotals.current.has(order.id)) {
        lastTotals.current.set(order.id, order.total);
      }
    }
  }, [knownOrders]);

  useEffect(() => {
    if (!channel) return;

    const notify = (order: ApiOrder) => {
      toast(t("shell.newOrder.title", { code: order.code }), {
        description: t("shell.newOrder.body", { table: order.table_name, total: fmt(Number(order.total)) }),
        ...(onToastClick
          ? // With an action, stay until dismissed: staff may not reach "View" in 4 s (WCAG 2.2.1).
            { action: { label: t("shell.newOrder.view"), onClick: onToastClick }, duration: Infinity }
          : {}),
      });
      playNotificationSound();
      onNewOrder?.();
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
