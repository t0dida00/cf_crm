import { describe, expect, test } from "vitest";
import { daysAgoStart } from "./range";

describe("daysAgoStart", () => {
  const now = new Date(2026, 8, 26, 15, 42, 10);

  test("0 is today's local midnight", () => {
    expect(daysAgoStart(0, now)).toBe(new Date(2026, 8, 26).getTime());
  });

  test("1 is yesterday's local midnight", () => {
    expect(daysAgoStart(1, now)).toBe(new Date(2026, 8, 25).getTime());
  });

  test("crosses month boundaries", () => {
    expect(daysAgoStart(1, new Date(2026, 9, 1, 0, 5))).toBe(new Date(2026, 8, 30).getTime());
  });
});
