import type { Booking } from "./types";

/** Bookable window and time interval. Times start every SLOT_MINUTES from
 * OPENING_TIME; the last one starts SLOT_MINUTES before CLOSING_TIME. */
export const OPENING_TIME = "09:00";
export const CLOSING_TIME = "22:00";
export const SLOT_MINUTES = 15;

const pad = (n: number) => String(n).padStart(2, "0");

/** "19:15" → 1155 (minutes since midnight). */
export const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
};

export const toTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** Booking start times, e.g. ["09:00", "09:15", …, "21:45"]. */
export function slotTimes(open = OPENING_TIME, close = CLOSING_TIME, step = SLOT_MINUTES): string[] {
  const out: string[] = [];
  for (let t = toMinutes(open); t < toMinutes(close); t += step) out.push(toTime(t));
  return out;
}

export const SLOT_TIMES = slotTimes();

/** Local calendar day as "YYYY-MM-DD" — the form bookings are stored and
 * compared in, so no time zone can shift a booking onto another day. */
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "2026-09-26" → local midnight of that day. */
export const parseDayKey = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export interface DaySummary {
  bookings: number;
  guests: number;
}

/** Per-day booking and guest totals for the calendar, keyed by dayKey. */
export function summariseDays(bookings: Booking[]): Map<string, DaySummary> {
  const out = new Map<string, DaySummary>();
  for (const b of bookings) {
    const day = out.get(b.date) ?? { bookings: 0, guests: 0 };
    out.set(b.date, { bookings: day.bookings + 1, guests: day.guests + b.party });
  }
  return out;
}

/** Weeks (Monday first) covering a month, padded with the neighbouring
 * months' days so every week has 7 dates. */
export function monthGrid(year: number, month: number): Date[][] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // days since Monday
  const start = new Date(year, month, 1 - lead);
  const days = new Date(year, month + 1, 0).getDate();
  const weeks = Math.ceil((lead + days) / 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d)),
  );
}

/** Start times still bookable on `date`: all of them on a future day, only the
 * ones after `now` today, none on a past day. */
export function availableTimes(date: string, now: Date = new Date(), times: string[] = SLOT_TIMES): string[] {
  const today = dayKey(now);
  if (date < today) return [];
  if (date > today) return times;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return times.filter((t) => toMinutes(t) > nowMinutes);
}

/** Bookings before today, newest first (latest day, then latest time). */
export function pastBookings(bookings: Booking[], now: Date = new Date()): Booking[] {
  const today = dayKey(now);
  return bookings
    .filter((b) => b.date < today)
    .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
}
