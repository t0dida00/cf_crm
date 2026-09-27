import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { Category, Dish } from "@/lib/types";
import { axeViolations } from "@/test/axe";
import { ClientShell } from "./ClientShell";

vi.mock("@/components/common/DishImage", () => ({ DishImage: () => null }));

afterEach(cleanup);

const categories: Category[] = [{ id: "c1", name: "Drinks", valid: true }];
const dishes = [
  { id: "d1", name: "Coca cola", price: 3, catId: "c1", status: "valid", taxMode: "none" },
  { id: "d2", name: "Pepsi", price: 3, catId: "c1", status: "valid", taxMode: "none" },
] as Dish[];

const renderShell = (placeOrder = vi.fn(async () => ({ id: "o1", code: "ORD-1", lines: [] }))) =>
  render(
    <ClientShell
      tableName="Table 3"
      workspaceName="Khoa Restaurant"
      categories={categories}
      dishes={dishes}
      taxRate={0}
      fmt={(v) => `€${v.toFixed(2)}`}
      orders={[]}
      placeOrder={placeOrder as never}
      createTableRequest={vi.fn()}
    />,
  );

describe("ClientShell keyboard focus", () => {
  test("Add moves focus to the new counter's +, and back to Add when the counter reaches 0", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Add Coca cola" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add one Coca cola" }));

    fireEvent.click(screen.getByRole("button", { name: "Remove one Coca cola" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add Coca cola" }));
  });

  test("removing with the bin returns focus to that dish's Add", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Add Pepsi" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove Pepsi" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Add Pepsi" }));
  });

  test("a new screen focuses its heading, so it's announced", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Add Coca cola" }));
    fireEvent.click(screen.getByRole("button", { name: /Order · 1 item/ }));
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "Your order" }));
  });

  test("an order error is announced", async () => {
    renderShell(vi.fn(async () => Promise.reject(new Error("Kitchen closed"))));
    fireEvent.click(screen.getByRole("button", { name: "Add Coca cola" }));
    fireEvent.click(screen.getByRole("button", { name: /Order · 1 item/ }));
    const place = screen.getAllByRole("button").find((b) => /place|confirm|send/i.test(b.textContent ?? ""));
    await act(async () => fireEvent.click(place!));
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  test("the menu and review screens have no axe violations", async () => {
    const { container } = renderShell();
    expect(await axeViolations(container)).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Add Coca cola" }));
    fireEvent.click(screen.getByRole("button", { name: /Order · 1 item/ }));
    expect(await axeViolations(container)).toEqual([]);
  });
});
