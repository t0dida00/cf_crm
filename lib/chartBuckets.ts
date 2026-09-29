import { INTL_LOCALE, type Locale } from "./i18n/config";
import type { RangeId } from "./types";

export type ChartBucket = "hour" | "day" | "month" | "year";

export interface ChartSlot {
  /** Matches the backend's bucket key: local time truncated, `YYYY-MM-DDTHH`. */
  key: string;
  /** Axis label: "09:00", "Mon", "14", "Sep". */
  label: string;
  /** Tooltip title: "09:00–10:00", "Mon 21 Sep", "14 Sep 2026", "September 2026". */
  title: string;
}

export interface ChartPlan {
  bucket: ChartBucket;
  /** Epoch ms bounds of the whole period (future slots are simply empty). */
  from: number;
  to: number;
  slots: ChartSlot[];
}

// Fixed abbreviations: en-GB's short month for September is "Sept".
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}`;
/** A short month for the axis: fixed English abbreviations, "T9" in Vietnamese. */
const shortMonth = (locale: Locale, i: number) => (locale === "vi" ? `T${i + 1}` : MONTHS[i]);

/**
 * How the dashboard chart buckets a range, in the viewer's local time:
 * today → 24 hours, last 7 days → weekdays, this month → days of the month,
 * this year → months, all time → years from the oldest order's year. Custom
 * ranges, and all time with no orders yet (`oldestTs` null), have no chart
 * (null).
 */
export function chartPlan(
  rangeId: RangeId,
  now: Date = new Date(),
  oldestTs: number | null = null,
  locale: Locale = "en",
): ChartPlan | null {
  /** Dates in the viewer's language (en-GB or vi-VN). */
  const fmt = (at: Date, options: Intl.DateTimeFormatOptions) => at.toLocaleDateString(INTL_LOCALE[locale], options);
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  switch (rangeId) {
    case "today": {
      const slots = Array.from({ length: 24 }, (_, h) => {
        const at = new Date(y, m, d, h);
        return { key: keyOf(at), label: `${pad(h)}:00`, title: `${pad(h)}:00–${pad((h + 1) % 24)}:00` };
      });
      return { bucket: "hour", from: new Date(y, m, d).getTime(), to: new Date(y, m, d + 1).getTime() - 1, slots };
    }
    case "week": {
      const slots = Array.from({ length: 7 }, (_, i) => {
        const at = new Date(y, m, d - 6 + i);
        return {
          key: keyOf(at),
          label: fmt(at, { weekday: "short" }),
          title: fmt(at, { weekday: "short", day: "numeric", month: "short" }),
        };
      });
      return { bucket: "day", from: new Date(y, m, d - 6).getTime(), to: new Date(y, m, d + 1).getTime() - 1, slots };
    }
    case "month": {
      const days = new Date(y, m + 1, 0).getDate();
      const slots = Array.from({ length: days }, (_, i) => {
        const at = new Date(y, m, i + 1);
        return {
          key: keyOf(at),
          label: String(i + 1),
          title: fmt(at, { day: "numeric", month: "short", year: "numeric" }),
        };
      });
      return { bucket: "day", from: new Date(y, m, 1).getTime(), to: new Date(y, m + 1, 1).getTime() - 1, slots };
    }
    case "year": {
      const slots = Array.from({ length: 12 }, (_, i) => {
        const at = new Date(y, i, 1);
        return {
          key: keyOf(at),
          label: shortMonth(locale, i),
          title: fmt(at, { month: "long", year: "numeric" }),
        };
      });
      return { bucket: "month", from: new Date(y, 0, 1).getTime(), to: new Date(y + 1, 0, 1).getTime() - 1, slots };
    }
    case "all": {
      if (oldestTs === null) return null;
      const oy = new Date(Math.min(oldestTs, now.getTime())).getFullYear();
      const slots = Array.from({ length: y - oy + 1 }, (_, i) => {
        const at = new Date(oy + i, 0, 1);
        return { key: keyOf(at), label: String(oy + i), title: String(oy + i) };
      });
      return { bucket: "year", from: new Date(oy, 0, 1).getTime(), to: new Date(y + 1, 0, 1).getTime() - 1, slots };
    }
    default:
      return null;
  }
}

export interface SeriesPoint {
  bucket: string;
  orders: number;
  takings: number;
}

/** Lines the backend's (sparse) buckets up with every slot, zero-filling gaps. */
export function fillSlots(slots: ChartSlot[], series: SeriesPoint[]) {
  const byKey = new Map(series.map((p) => [p.bucket, p]));
  return slots.map((slot) => ({
    ...slot,
    orders: byKey.get(slot.key)?.orders ?? 0,
    takings: byKey.get(slot.key)?.takings ?? 0,
  }));
}
