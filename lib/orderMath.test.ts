import { describe, expect, test } from "vitest";
import {
  formatTaxRates,
  groupIntoSessions,
  lineTotal,
  summariseLines,
  toSession,
} from "./orderMath";
import type { Order } from "./types";

const order = (overrides: Partial<Order>): Order => ({
  id: "o1",
  code: "ORD-1",
  tableName: "Table 1",
  lines: [],
  total: 0,
  taxRate: 20,
  ts: 0,
  status: "Paid",
  closedTs: null,
  sessionId: null,
  ...overrides,
});

describe("lineTotal", () => {
  test("sums price × qty", () => {
    expect(
      lineTotal([
        { itemId: "a", name: "Pepsi", price: 12, qty: 2 },
        { itemId: "b", name: "Cola", price: 3.5, qty: 4 },
      ]),
    ).toBe(38);
  });
});

describe("summariseLines", () => {
  test("merges lines with the same name", () => {
    expect(
      summariseLines([
        { itemId: "a", name: "Pepsi", price: 12, qty: 2 },
        { itemId: "a", name: "Pepsi", price: 12, qty: 3, note: "no ice" },
        { itemId: "b", name: "Cola", price: 12, qty: 1 },
      ]),
    ).toEqual([
      { name: "Pepsi", qty: 5 },
      { name: "Cola", qty: 1 },
    ]);
  });
});

describe("formatTaxRates", () => {
  test("shows a single rate", () => {
    expect(formatTaxRates([order({ taxRate: 20 }), order({ taxRate: 20 })])).toBe("20%");
  });

  test("lists distinct rates in ascending order", () => {
    expect(formatTaxRates([order({ taxRate: 20 }), order({ taxRate: 10 })])).toBe("10% / 20%");
  });

  test("falls back to 0% with no orders", () => {
    expect(formatTaxRates([])).toBe("0%");
  });
});

describe("toSession", () => {
  test("sorts newest first and totals the orders", () => {
    const s = toSession([
      order({ id: "a", ts: 1, total: 10, closedTs: 5 }),
      order({ id: "b", ts: 3, total: 15, closedTs: 7 }),
    ]);
    expect(s.orders.map((o) => o.id)).toEqual(["b", "a"]);
    expect(s.ts).toBe(3);
    expect(s.total).toBe(25);
    expect(s.closedTs).toBe(7);
  });

  test("is still open if any order is open", () => {
    const s = toSession([order({ closedTs: 5 }), order({ id: "b", closedTs: null })]);
    expect(s.closedTs).toBeNull();
  });
});

describe("groupIntoSessions", () => {
  test("groups by sessionId and keeps orders without one separate", () => {
    const sessions = groupIntoSessions([
      order({ id: "a", sessionId: "s1", ts: 1 }),
      order({ id: "b", sessionId: "s1", ts: 2 }),
      order({ id: "c", sessionId: null, ts: 3 }),
    ]);
    expect(sessions.map((s) => s.orders.map((o) => o.id))).toEqual([["c"], ["b", "a"]]);
  });
});
