"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

const POLL_INTERVAL_MS = 2000;

interface ApiTableRequest {
  id: string;
  table_name: string;
  type: "call_staff" | "checkout";
}

const LABELS: Record<ApiTableRequest["type"], string> = {
  call_staff: "called staff",
  checkout: "requested checkout",
};

/** Polls for pending Call Staff / Checkout requests from /client (a separate,
 * often anonymous session) and toasts once per newly-seen request id.
 * `onNewRequest` lets the caller refresh its own list so the queue panel
 * stays in sync with what triggered the toast. */
export function useTableRequestNotifications(enabled: boolean, onNewRequest: () => void) {
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const poll = async () => {
      try {
        const res = await apiFetch<{ requests: ApiTableRequest[] }>(
          "/table-requests?status=pending",
        );
        if (cancelled) return;

        if (seenIds.current === null) {
          seenIds.current = new Set(res.requests.map((r) => r.id));
          return;
        }

        const newRequests = res.requests.filter((r) => !seenIds.current!.has(r.id));
        for (const request of res.requests) seenIds.current.add(request.id);

        if (newRequests.length > 0) {
          for (const request of newRequests) {
            toast(`${request.table_name} ${LABELS[request.type]}`);
          }
          onNewRequest();
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
