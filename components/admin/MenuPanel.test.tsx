import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { Category, Dish } from "@/lib/types";

const CATEGORIES: Category[] = [
  { id: "c1", name: "Mains", valid: true },
  { id: "c2", name: "Specials", valid: false },
];
const DISHES: Dish[] = [
  { id: "d1", name: "Seafood paella", price: 19.5, catId: "c1", status: "valid", taxMode: "none", description: "For one, prawn, mussel, squid", isVegan: true },
  { id: "d2", name: "Ribeye 300g", price: 26, catId: "c1", status: "sold_out", taxMode: "none" },
  { id: "d3", name: "Crema catalana", price: 6.5, catId: "c1", status: "hidden", taxMode: "none" },
  { id: "d4", name: "Suquet", price: 22, catId: "c2", status: "valid", taxMode: "none" },
];

vi.mock("@/components/providers/WorkspaceProvider", () => ({
  useWorkspace: () => ({
    workspace: {
      categories: CATEGORIES,
      dishes: DISHES,
      settings: { currency: "EUR", taxRate: 10, specialTaxes: [] },
    },
    fmt: (v: number) => `€${v.toFixed(2)}`,
    saveDish: vi.fn(),
    deleteDish: vi.fn(),
  }),
}));

import { MenuPanel } from "./MenuPanel";

afterEach(cleanup);

/** The dish row: the grid holding the dish's name. */
const row = (name: string) => screen.getByText(name).closest(".grid") as HTMLElement;

describe("MenuPanel", () => {
  test("shows each dish's description under its name", () => {
    render(<MenuPanel createSignal={0} />);
    expect(row("Seafood paella").textContent).toContain("For one, prawn, mussel, squid");
  });

  test("the Vegan tag sits on the name's line", () => {
    render(<MenuPanel createSignal={0} />);
    expect(screen.getByText("Vegan").parentElement?.textContent).toBe("Seafood paellaVegan");
  });

  test("tags only the dishes that need attention", () => {
    render(<MenuPanel createSignal={0} />);
    expect(row("Seafood paella").textContent).not.toMatch(/Available|Sold out|Hidden/);
    expect(row("Ribeye 300g").textContent).toContain("Sold out");
    expect(row("Crema catalana").textContent).toContain("Hidden");
    expect(row("Suquet").textContent).toContain("Hidden with category");
  });
});
