import { describe, expect, test } from "vitest";
import {
  availableTimes,
  dayKey,
  monthGrid,
  parseDayKey,
  pastBookings,
  slotTimes,
  summariseDays,
  toMinutes,
  toTime,
} from "./bookingSlots";
import type { Booking } from "./types";

const booking = (overrides: Partial<Booking>): Booking => ({
  id: "b1",
  name: "Guest",
  time: "19:00",
  party: 2,
  tableName: null,
  status: "Confirmed",
  date: "2026-09-26",
  ts: 0,
  ...overrides,
});

describe("time helpers", () => {
  test("convert between HH:MM and minutes", () => {
    expect(toMinutes("19:15")).toBe(1155);
    expect(toTime(1155)).toBe("19:15");
    expect(toTime(540)).toBe("09:00");
  });

  test("slotTimes steps every 15 minutes up to (not including) closing", () => {
    const slots = slotTimes("09:00", "22:00", 15);
    expect(slots[0]).toBe("09:00");
    expect(slots[1]).toBe("09:15");
    expect(slots.at(-1)).toBe("21:45");
    expect(slots).toHaveLength(52);
  });

  test("dayKey / parseDayKey round-trip in local time", () => {
    expect(dayKey(new Date(2026, 8, 5, 23, 59))).toBe("2026-09-05");
    expect(parseDayKey("2026-09-05").getTime()).toBe(new Date(2026, 8, 5).getTime());
  });
});

describe("summariseDays", () => {
  test("totals bookings and guests per day", () => {
    const days = summariseDays([
      booking({ date: "2026-09-26", party: 6 }),
      booking({ id: "b2", date: "2026-09-26", party: 4 }),
      booking({ id: "b3", date: "2026-09-27", party: 2 }),
    ]);
    expect(days.get("2026-09-26")).toEqual({ bookings: 2, guests: 10 });
    expect(days.get("2026-09-27")).toEqual({ bookings: 1, guests: 2 });
    expect(days.get("2026-09-28")).toBeUndefined();
  });
});

describe("monthGrid", () => {
  test("starts on Monday and pads to whole weeks", () => {
    // September 2026 starts on a Tuesday and has 30 days.
    const weeks = monthGrid(2026, 8);
    expect(weeks).toHaveLength(5);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(dayKey(weeks[0][0])).toBe("2026-08-31");
    expect(dayKey(weeks[0][1])).toBe("2026-09-01");
    expect(dayKey(weeks[4][6])).toBe("2026-10-04");
  });

  test("a month starting on Monday needs no leading days", () => {
    // June 2026 starts on a Monday.
    expect(dayKey(monthGrid(2026, 5)[0][0])).toBe("2026-06-01");
  });
});

describe("availableTimes", () => {
  const now = new Date(2026, 8, 26, 13, 20);
  const times = ["09:00", "13:15", "13:30", "21:45"];

  test("offers every time on a future day", () => {
    expect(availableTimes("2026-09-27", now, times)).toEqual(times);
  });

  test("offers only times after now today", () => {
    expect(availableTimes("2026-09-26", now, times)).toEqual(["13:30", "21:45"]);
  });

  test("offers nothing on a past day", () => {
    expect(availableTimes("2026-09-25", now, times)).toEqual([]);
  });
});

describe("pastBookings", () => {
  test("keeps days before today, newest day and time first", () => {
    const now = new Date(2026, 8, 26, 10);
    const list = pastBookings(
      [
        booking({ id: "a", date: "2026-09-26", time: "09:00" }),
        booking({ id: "b", date: "2026-09-20", time: "12:00" }),
        booking({ id: "c", date: "2026-09-25", time: "18:00" }),
        booking({ id: "d", date: "2026-09-25", time: "20:00" }),
        booking({ id: "e", date: "2026-10-01", time: "19:00" }),
      ],
      now,
    );
    expect(list.map((b) => b.id)).toEqual(["d", "c", "b"]);
  });
});
