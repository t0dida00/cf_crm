import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { Category, Dish } from "@/lib/types";
import { i18n } from "@/lib/i18n";

vi.mock("@/components/common/DishImage", () => ({ DishImage: () => null }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), useSearchParams: () => new URLSearchParams() }));

const CATEGORIES: Category[] = [{ id: "c1", name: "Mains", valid: true }];
const DISHES: Dish[] = [
  {
    id: "d1",
    name: "Seafood paella",
    price: 19.5,
    catId: "c1",
    status: "valid",
    taxMode: "none",
    isVegan: true,
    soldCount: 12,
    description: "For one, prawn, mussel, squid",
  },
];

vi.mock("@/components/providers/WorkspaceProvider", () => ({
  useWorkspace: () => ({
    workspace: { categories: CATEGORIES, dishes: DISHES, tables: [], orders: [] },
    fmt: (v: number) => `€${v.toFixed(2)}`,
    placeOrder: vi.fn(),
    saveDish: vi.fn(),
  }),
}));

import { StaffMenuPanel } from "./StaffMenuPanel";

afterEach(cleanup);

describe("StaffMenuPanel", () => {
  test("the name comes first, then its tags, then the description", () => {
    render(<StaffMenuPanel />);
    const tags = screen.getByText("Vegan").parentElement!;
    expect(tags.textContent).toContain("Best seller");
    // The name's row (name and price) comes right before the tags; the description right after.
    expect(tags.previousElementSibling?.textContent).toContain("Seafood paella");
    expect(tags.nextElementSibling?.textContent).toBe("For one, prawn, mussel, squid");
  });
});

describe("StaffMenuPanel in Vietnamese", () => {
  afterEach(() => i18n.changeLanguage("en"));

  test("tags, status and search follow the chosen language", async () => {
    await i18n.changeLanguage("vi");
    render(<StaffMenuPanel />);
    expect(screen.getByText("Chay")).toBeTruthy();
    expect(screen.getByText("Bán chạy")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Tìm món" })).toBeTruthy();
    expect(screen.getByText("1 món")).toBeTruthy();
  });
});
