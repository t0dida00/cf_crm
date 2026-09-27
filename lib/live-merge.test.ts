import { describe, expect, test } from "vitest";
import { isNewer, removeById, upsertById } from "./live-merge";

const a = { id: "a", n: 1 };
const b = { id: "b", n: 2 };

describe("upsertById", () => {
  test("adds a new item first", () => {
    expect(upsertById([a], b)).toEqual([b, a]);
  });
  test("replaces a changed item in place", () => {
    expect(upsertById([a, b], { id: "a", n: 9 })).toEqual([{ id: "a", n: 9 }, b]);
  });
  test("returns the same array for an unchanged item (a device's own echo)", () => {
    const list = [a, b];
    expect(upsertById(list, { id: "b", n: 2 })).toBe(list);
  });
});

describe("removeById", () => {
  test("removes, or returns the same array when absent", () => {
    const list = [a, b];
    expect(removeById(list, "a")).toEqual([b]);
    expect(removeById(list, "z")).toBe(list);
  });
});

describe("isNewer", () => {
  test("applies newer events and skips ones that arrive late", () => {
    const seen = new Map<string, number>();
    expect(isNewer(seen, "o1", "2026-09-27T10:00:02Z")).toBe(true);
    expect(isNewer(seen, "o1", "2026-09-27T10:00:01Z")).toBe(false);
    expect(isNewer(seen, "o1", "2026-09-27T10:00:03Z")).toBe(true);
  });
  test("applies rows without a timestamp", () => {
    expect(isNewer(new Map(), "o1", undefined)).toBe(true);
  });
});
