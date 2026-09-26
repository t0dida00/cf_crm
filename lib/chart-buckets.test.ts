import { describe, expect, test } from "vitest";
import { chartPlan, fillSlots } from "./chart-buckets";

// Saturday 26 Sep 2026, 16:30 local time.
const now = new Date(2026, 8, 26, 16, 30);

describe("chartPlan", () => {
  test("today → 24 hourly slots covering the whole day", () => {
    const plan = chartPlan("today", now)!;
    expect(plan.bucket).toBe("hour");
    expect(plan.slots).toHaveLength(24);
    expect(plan.slots[9]).toEqual({ key: "2026-09-26T09", label: "09:00", title: "09:00–10:00" });
    expect(plan.slots[23].title).toBe("23:00–00:00");
    expect(plan.from).toBe(new Date(2026, 8, 26).getTime());
    expect(plan.to).toBe(new Date(2026, 8, 27).getTime() - 1);
  });

  test("week → the last 7 days by weekday, ending today", () => {
    const plan = chartPlan("week", now)!;
    expect(plan.bucket).toBe("day");
    expect(plan.slots.map((s) => s.label)).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
    expect(plan.slots[0].key).toBe("2026-09-20T00");
    expect(plan.slots[6].key).toBe("2026-09-26T00");
    expect(plan.from).toBe(new Date(2026, 8, 20).getTime());
  });

  test("month → every day of the month, numbered", () => {
    const plan = chartPlan("month", now)!;
    expect(plan.bucket).toBe("day");
    expect(plan.slots).toHaveLength(30);
    expect(plan.slots[0]).toMatchObject({ key: "2026-09-01T00", label: "1" });
    expect(plan.slots[29].label).toBe("30");
    expect(plan.to).toBe(new Date(2026, 9, 1).getTime() - 1);
  });

  test("month handles February in a leap year", () => {
    expect(chartPlan("month", new Date(2028, 1, 10))!.slots).toHaveLength(29);
  });

  test("year → 12 months", () => {
    const plan = chartPlan("year", now)!;
    expect(plan.bucket).toBe("month");
    expect(plan.slots.map((s) => s.label)).toEqual([
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ]);
    expect(plan.slots[8]).toMatchObject({ key: "2026-09-01T00", title: "September 2026" });
  });

  test("all time → one bar per year from the oldest order's year", () => {
    const plan = chartPlan("all", now, new Date(2025, 8, 26, 9).getTime())!;
    expect(plan.bucket).toBe("year");
    expect(plan.slots).toEqual([
      { key: "2025-01-01T00", label: "2025", title: "2025" },
      { key: "2026-01-01T00", label: "2026", title: "2026" },
    ]);
    expect(plan.from).toBe(new Date(2025, 0, 1).getTime());
    expect(plan.to).toBe(new Date(2027, 0, 1).getTime() - 1);
  });

  test("all time → a single year when every order is this year", () => {
    expect(chartPlan("all", now, new Date(2026, 1, 2).getTime())!.slots.map((s) => s.label)).toEqual([
      "2026",
    ]);
  });

  test("all time with no orders, and custom ranges, have no chart", () => {
    expect(chartPlan("all", now, null)).toBeNull();
    expect(chartPlan("custom", now)).toBeNull();
  });
});

describe("fillSlots", () => {
  test("matches buckets by key and zero-fills the rest", () => {
    const slots = chartPlan("week", now)!.slots;
    const filled = fillSlots(slots, [{ bucket: "2026-09-21T00", orders: 3, takings: 36 }]);
    expect(filled[1]).toMatchObject({ label: "Mon", orders: 3, takings: 36 });
    expect(filled[0]).toMatchObject({ orders: 0, takings: 0 });
    expect(filled).toHaveLength(7);
  });
});
