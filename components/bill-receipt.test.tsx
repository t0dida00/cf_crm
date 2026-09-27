import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Order } from "@/lib/types";

const printReceipt = vi.hoisted(() => vi.fn());
vi.mock("@/lib/print-receipt", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/print-receipt")>()),
  printReceipt,
}));

import { PrintReceiptButton } from "./bill-receipt";

const order = {
  id: "o1",
  code: "ORD-1",
  ts: Date.UTC(2026, 8, 26, 16, 31),
  taxRate: 20,
  lines: [{ id: "l1", itemId: "d1", name: "Coca cola", price: 12, qty: 5 }],
} as unknown as Order;
const props = {
  workspaceName: "Khoa Restaurant",
  tableName: "Table 3",
  orders: [order],
  net: 50,
  tax: 10,
  total: 60,
  fmt: (v: number) => `€${v.toFixed(2)}`,
};

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  printReceipt.mockReset();
});

describe("PrintReceiptButton", () => {
  test("prints the receipt on 80 mm paper by default", () => {
    render(<PrintReceiptButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Print" }));

    const [source, paper] = printReceipt.mock.calls[0];
    expect(paper).toBe(80);
    expect((source as HTMLElement).textContent).toMatch(/Khoa Restaurant.*Table 3.*5× Coca cola.*€60\.00.*Total due/);
  });

  test("uses and remembers the chosen paper width", () => {
    render(<PrintReceiptButton {...props} />);
    fireEvent.change(screen.getByLabelText("Receipt paper width"), { target: { value: "58" } });
    fireEvent.click(screen.getByRole("button", { name: "Print" }));
    expect(printReceipt.mock.calls[0][1]).toBe(58);
    expect(localStorage.getItem("tably:receipt-paper")).toBe("58");
    cleanup();

    render(<PrintReceiptButton {...props} />);
    expect((screen.getByLabelText("Receipt paper width") as HTMLSelectElement).value).toBe("58");
  });

  test("keeps the printable receipt out of sight on screen", () => {
    const { container } = render(<PrintReceiptButton {...props} />);
    expect(container.querySelector("div[hidden]")?.textContent).toContain("Total due");
  });
});
