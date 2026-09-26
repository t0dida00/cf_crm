import { describe, expect, test } from "vitest";
import { formatNumber, money } from "./format";

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
