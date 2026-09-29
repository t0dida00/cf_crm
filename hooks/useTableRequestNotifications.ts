"use client";

import { t } from "@/lib/i18n";
import { useEffect } from "react";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/notificationSound";
import { usePlatformSocket } from "./usePlatformSocket";
import type { PusherConfig } from "@/lib/types";

interface ApiTableRequest {
  id: string;
  table_name: string;
  type: "call_staff" | "checkout";
}

/** Live-updates on pending Call Staff / Checkout requests from /client (a
 * separate, often anonymous session) — toasts on table_request:created.
 * `onNewRequest` lets the caller refresh its own list so the queue panel
 * stays in sync with what triggered the toast. */
export function useTableRequestNotifications(
  enabled: boolean,
  platformId: string | null,
  onNewRequest: () => void,
  pusher?: PusherConfig | null,
) {
  const channel = usePlatformSocket(enabled ? platformId : null, pusher);

  useEffect(() => {
    if (!channel) return;

    const onCreated = ({ request }: { request: ApiTableRequest }) => {
      toast(t(`shell.requests.toast.${request.type}`, { table: request.table_name }));
      playNotificationSound();
      onNewRequest();
    };

    channel.bind("table_request:created", onCreated);
    return () => {
      channel.unbind("table_request:created", onCreated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);
}
