import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { axeViolations } from "@/test/axe";
import type { Category } from "@/lib/types";
import { CategoryList } from "./CategoryList";

afterEach(cleanup);

const CATEGORIES: Category[] = [
  { id: "a", name: "Starters", valid: true },
  { id: "b", name: "Mains", valid: true },
  { id: "c", name: "Desserts", valid: false },
];

const renderList = (onReorder = vi.fn()) =>
  render(
    <CategoryList
      categories={CATEGORIES}
      dishCount={(id) => (id === "b" ? 1 : 3)}
      onReorder={onReorder}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
      isDeleting={() => false}
    />,
  );

describe("CategoryList", () => {
  test("shows the categories in menu order with their dishes and visibility", () => {
    renderList();
    const rows = within(screen.getByRole("list", { name: "Categories, in menu order" })).getAllByRole("listitem");
    expect(rows.map((r) => r.textContent)).toEqual([
      "1Starters3 dishesOn the menu",
      "2Mains1 dishOn the menu",
      "3Desserts3 dishesHidden",
    ]);
  });

  test("Move up and Move down save the whole new order", () => {
    const onReorder = vi.fn();
    renderList(onReorder);
    fireEvent.click(screen.getByRole("button", { name: "Move Desserts up" }));
    expect(onReorder).toHaveBeenLastCalledWith(["a", "c", "b"]);
    fireEvent.click(screen.getByRole("button", { name: "Move Starters down" }));
    expect(onReorder).toHaveBeenLastCalledWith(["c", "a", "b"]);
  });

  test("the first can't move up and the last can't move down", () => {
    renderList();
    expect((screen.getByRole("button", { name: "Move Starters up" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Move Desserts down" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Move Mains up" }) as HTMLButtonElement).disabled).toBe(false);
  });

  test("every row has a drag handle", () => {
    renderList();
    expect(screen.getAllByRole("button", { name: /^Drag to reorder / })).toHaveLength(3);
  });

  test("says so when there are no categories", () => {
    render(
      <CategoryList categories={[]} dishCount={() => 0} onReorder={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} isDeleting={() => false} />,
    );
    expect(screen.getByText("No categories yet.")).toBeTruthy();
  });

  test("has no axe violations", async () => {
    const { container } = renderList();
    expect(await axeViolations(container)).toEqual([]);
  });
});
