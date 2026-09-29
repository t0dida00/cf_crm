import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { Category, Dish } from "@/lib/types";
import { axeViolations } from "@/test/axe";
import { ClientShell } from "./ClientShell";

vi.mock("@/components/common/DishImage", () => ({ DishImage: () => null }));

afterEach(cleanup);

const categories: Category[] = [{ id: "c1", name: "Drinks", valid: true }];
const dishes = [
  { id: "d1", name: "Coca cola", price: 3, catId: "c1", status: "valid", taxMode: "none", isVegan: true, isBestSeller: true },
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

describe("ClientShell dish tags", () => {
  test("Vegan and Best seller sit on their own line below the dish name", () => {
    renderShell();
    // The name's row: the name, a dotted leader and the price.
    const nameRow = screen.getByRole("heading", { name: "Coca cola" }).parentElement!;
    expect(nameRow.textContent).toBe("Coca cola€3.00");
    const tags = nameRow.nextElementSibling!;
    expect(tags.textContent).toBe("VeganBest seller");
  });

  test("a dish without tags has no tag row", () => {
    renderShell();
    const nameRow = screen.getByRole("heading", { name: "Pepsi" }).parentElement!;
    expect(nameRow.nextElementSibling?.textContent ?? "").not.toMatch(/Vegan|Best seller/);
  });
});

describe("ClientShell brochure", () => {
  const pages = () => screen.getAllByRole("region").filter((r) => r.getAttribute("aria-roledescription") === "page");

  test("opens on the cover, with a page per section after it", () => {
    renderShell();
    expect(pages().map((p) => p.getAttribute("aria-label"))).toEqual(["Page 1 of 2: Contents", "Page 2 of 2: Drinks"]);
    expect(screen.getByText("Page 1 of 2")).toBeTruthy();
    // Only the page on screen can be used; the others are inert.
    expect(pages().map((p) => p.hasAttribute("inert"))).toEqual([false, true]);
  });

  test("the contents, the arrows and the section pills turn the page", () => {
    renderShell();
    fireEvent.click(screen.getByRole("button", { name: "Drinks, page 2" }));
    expect(screen.getByText("Page 2 of 2")).toBeTruthy();
    expect(pages().map((p) => p.hasAttribute("inert"))).toEqual([true, false]);
    expect((screen.getByRole("button", { name: "Next page" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(screen.getByText("Page 1 of 2")).toBeTruthy();

    const nav = screen.getByRole("navigation", { name: "Menu sections" });
    fireEvent.click(within(nav).getByRole("button", { name: "Drinks" }));
    expect(within(nav).getByRole("button", { name: "Drinks" }).getAttribute("aria-current")).toBe("page");
  });
});
