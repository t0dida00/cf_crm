import type { RangeId } from "./types";

export const RANGES: { id: RangeId; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Last 7 days" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom range" },
];

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

export function rangeCaption(range: RangeState, oldestTs: number): string {
  const today = Date.now();
  if (range.id === "all") {
    return `All time · ${formatDate(oldestTs)} – ${formatDate(today)}`;
  }
  if (range.id === "custom") {
    const from = range.from
      ? formatDate(new Date(`${range.from}T00:00:00`).getTime())
      : "Start";
    const to = range.to
      ? formatDate(new Date(`${range.to}T00:00:00`).getTime())
      : "Today";
    return `${from} – ${to}`;
  }
  return `${formatDate(rangeBounds(range)[0])} – ${formatDate(today)}`;
}

export const money = (value: number, currency: string) =>
  `${currency}${(Math.round(value * 100) / 100).toFixed(2)}`;
