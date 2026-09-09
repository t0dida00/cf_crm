"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/notification-sound";
import { usePlatformSocket } from "@/hooks/use-platform-socket";

interface ApiTableRequest {
  id: string;
  table_name: string;
  type: "call_staff" | "checkout";
}

const LABELS: Record<ApiTableRequest["type"], string> = {
  call_staff: "called staff",
  checkout: "requested checkout",
};

/** Live-updates on pending Call Staff / Checkout requests from /client (a
 * separate, often anonymous session) — toasts on table_request:created.
 * `onNewRequest` lets the caller refresh its own list so the queue panel
 * stays in sync with what triggered the toast. */
export function useTableRequestNotifications(
  enabled: boolean,
  platformId: string | null,
  onNewRequest: () => void,
) {
  const channel = usePlatformSocket(enabled ? platformId : null);

  useEffect(() => {
    if (!channel) return;

    const onCreated = ({ request }: { request: ApiTableRequest }) => {
      toast(`${request.table_name} ${LABELS[request.type]}`);
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
