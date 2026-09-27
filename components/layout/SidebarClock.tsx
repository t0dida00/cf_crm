"use client";

import { useNow } from "@/hooks/useNow";

/** The sidebar's date and time. Ticks every second on its own, so the shell doesn't re-render. */
export function SidebarClock({ className }: { className?: string }) {
  const now = new Date(useNow(1000));
  const date = now.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return <div className={className}>{`${date} · ${time}`}</div>;
}
