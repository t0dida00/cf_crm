import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { axeViolations } from "@/test/axe";
import { ReceiptPreview, splitIncludedTax } from "./ReceiptPreview";

afterEach(cleanup);

const LINES = [
  { qty: 2, name: "Pepsi", price: 12 },
  { qty: 1, name: "Coca cola", price: 12 },
];

describe("splitIncludedTax", () => {
  test("takes the tax out of a price that already includes it", () => {
    const { net, tax } = splitIncludedTax(110, 10);
    expect(net).toBeCloseTo(100);
    expect(tax).toBeCloseTo(10);
    expect(splitIncludedTax(50, 0)).toEqual({ net: 50, tax: 0 });
  });
});

describe("ReceiptPreview", () => {
  test("shows the restaurant, the lines and the total in the chosen currency", () => {
    const { container } = render(
      <ReceiptPreview name="Khoa Restaurant" address="Puistokatu 6A" phone="0401997250" taxRate={20} currency="$" lines={LINES} />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("Khoa Restaurant");
    expect(text).toContain("Puistokatu 6A");
    expect(text).toContain("2× Pepsi");
    expect(text).toContain("Tax (20%)");
    expect(text).toContain("Total due$36.00");
    expect(screen.getByText(/a \$36\.00 bill carries \$6\.00 of tax/)).toBeTruthy();
  });

  test("falls back to a placeholder name while the name is empty", () => {
    const { container } = render(
      <ReceiptPreview name="  " address="" phone="" taxRate={10} currency="€" lines={LINES} />,
    );
    expect(container.textContent).toContain("Your restaurant");
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <ReceiptPreview name="Khoa" address="" phone="" taxRate={10} currency="€" lines={LINES} />,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
