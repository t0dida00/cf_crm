"use client";

import { useTranslation } from "react-i18next";
import { useNow } from "@/hooks/useNow";
import { INTL_LOCALE, isLocale } from "@/lib/i18n/config";

/** The sidebar's date and time. Ticks every second on its own, so the shell doesn't re-render. */
export function SidebarClock({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const locale = INTL_LOCALE[isLocale(i18n.language) ? i18n.language : "en"];
  const now = new Date(useNow(1000));
  const date = now.toLocaleDateString(locale, { weekday: "short", day: "2-digit", month: "short" });
  const time = now.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return <div className={className}>{`${date}, ${time}`}</div>;
}
