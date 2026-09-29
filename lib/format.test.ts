import { describe, expect, test } from "vitest";
import { formatBadgeCount, formatNumber, money, moneyCompact } from "./format";

describe("money", () => {
  test("adds thousands separators and two decimals", () => {
    expect(money(66312720, "€")).toBe("€66,312,720.00");
    expect(money(90.05, "€")).toBe("€90.05");
  });

  test("rounds to two decimals", () => {
    expect(money(1234.567, "£")).toBe("£1,234.57");
    expect(money(0.004, "€")).toBe("€0.00");
  });

  test("handles zero and negatives", () => {
    expect(money(0, "$")).toBe("$0.00");
    expect(money(-12.5, "€")).toBe("€-12.50");
  });
});

describe("formatNumber", () => {
  test("adds thousands separators", () => {
    expect(formatNumber(1000006)).toBe("1,000,006");
    expect(formatNumber(999)).toBe("999");
  });

  test("drops decimals", () => {
    expect(formatNumber(1234.6)).toBe("1,235");
  });
});

describe("moneyCompact", () => {
  test("abbreviates thousands and millions", () => {
    expect(moneyCompact(7616136, "€")).toBe("€7.6M");
    expect(moneyCompact(240000, "€")).toBe("€240K");
    expect(moneyCompact(950, "€")).toBe("€950");
    expect(moneyCompact(0, "€")).toBe("€0");
    expect(moneyCompact(1500000000, "$")).toBe("$1.5B");
    expect(moneyCompact(-2500, "€")).toBe("€-2.5K");
  });
});

describe("formatBadgeCount", () => {
  test("shows the count up to 100, then 100+", () => {
    expect(formatBadgeCount(0)).toBe("0");
    expect(formatBadgeCount(100)).toBe("100");
    expect(formatBadgeCount(101)).toBe("100+");
    expect(formatBadgeCount(500)).toBe("100+");
  });
});

describe("Vietnamese đồng", () => {
  test("is written without decimals, dots between thousands, the symbol after", () => {
    expect(money(120000, "₫")).toBe("120.000 ₫");
    expect(money(9.5, "₫")).toBe("10 ₫");
    expect(moneyCompact(240000, "₫")).toBe("240K ₫");
  });
});
