import type { TFunction } from "i18next";
import type { RangeId } from "./types";

/** The dashboard's ranges; their names are under range.* in the translations. */
export const RANGES: { id: RangeId }[] = [
  { id: "today" },
  { id: "week" },
  { id: "month" },
  { id: "year" },
  { id: "all" },
  { id: "custom" },
]

export interface RangeState {
  id: RangeId;
  from: string;
  to: string;
}

export function rangeBounds({ id, from, to }: RangeState): [number, number] {
  const now = new Date();
  const at = (y: number, m: number, d: number) => new Date(y, m, d).getTime();
  switch (id) {
    case "today":
      return [at(now.getFullYear(), now.getMonth(), now.getDate()), Infinity];
    case "week":
      return [at(now.getFullYear(), now.getMonth(), now.getDate() - 6), Infinity];
    case "month":
      return [at(now.getFullYear(), now.getMonth(), 1), Infinity];
    case "year":
      return [at(now.getFullYear(), 0, 1), Infinity];
    case "custom":
      return [
        from ? new Date(`${from}T00:00:00`).getTime() : -Infinity,
        to ? new Date(`${to}T23:59:59`).getTime() : Infinity,
      ];
    default:
      return [-Infinity, Infinity];
  }
}

export const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString("en-GB");

export const hhmm = (ts: number) =>
  new Date(ts).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export const formatStamp = (ts: number) => `${formatDate(ts)} ${hhmm(ts)}`;

/** Local midnight `days` days before `now` (0 = today), in ms. */
export const daysAgoStart = (days: number, now: Date = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() - days).getTime();

export function rangeCaption(t: TFunction, range: RangeState, oldestTs: number): string {
  const today = Date.now();
  if (range.id === "all") {
    return t("range.allCaption", { from: formatDate(oldestTs), to: formatDate(today) });
  }
  if (range.id === "custom") {
    const from = range.from
      ? formatDate(new Date(`${range.from}T00:00:00`).getTime())
      : t("range.start");
    const to = range.to
      ? formatDate(new Date(`${range.to}T00:00:00`).getTime())
      : t("range.todayWord");
    return `${from} – ${to}`;
  }
  return `${formatDate(rangeBounds(range)[0])} – ${formatDate(today)}`;
}

// Kept here for existing imports; formatting helpers live in lib/format.ts.
export { money } from "./format";
