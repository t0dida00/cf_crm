import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { MENU_CSV_COLUMNS } from "@/lib/menuCsv";

const saveCategory = vi.fn(async (c: { name: string }) => ({ id: `new-${c.name}`, name: c.name, valid: true }));
const saveDish = vi.fn(async () => {});
const toastSuccess = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: vi.fn() } }));
vi.mock("@/components/providers/WorkspaceProvider", () => ({
  useWorkspace: () => ({
    workspace: {
      categories: [{ id: "c1", name: "Mains", valid: true }],
      dishes: [{ id: "d1", name: "Soup", price: 5, catId: "c1", status: "valid", taxMode: "none" }],
      settings: { specialTaxes: [{ id: "t1", name: "Wine", pct: 20 }] },
    },
    saveCategory,
    saveDish,
  }),
}));

import { MenuImportDialog } from "./MenuImportDialog";

const csv = (...lines: string[]) => [MENU_CSV_COLUMNS.join(","), ...lines].join("\n");

beforeEach(() => {
  saveCategory.mockClear();
  saveDish.mockClear();
});
afterEach(cleanup);

describe("MenuImportDialog", () => {
  test("previews what the file adds and updates, then imports it", async () => {
    const onClose = vi.fn();
    render(
      <MenuImportDialog
        file={{ name: "menu.csv", text: csv("Mains,soup,6,0,,,,0,2", "Desserts,Flan,4,1,wine,,,1,1") }}
        onClose={onClose}
      />,
    );
    expect(screen.getByText(/to add/).textContent).toBe("1 dish to add");
    expect(screen.getByText(/to update/).textContent).toContain("1 dish to update");
    expect(screen.getByText(/new category/).parentElement?.textContent).toBe("1 new category: Desserts");

    fireEvent.click(screen.getByRole("button", { name: "Import" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());

    expect(saveCategory).toHaveBeenCalledWith({ name: "Desserts", valid: true });
    expect(saveDish).toHaveBeenCalledWith(expect.objectContaining({ id: "d1", name: "soup", price: 6, catId: "c1" }));
    expect(saveDish).toHaveBeenCalledWith(
      expect.objectContaining({ id: undefined, name: "Flan", catId: "new-Desserts", taxMode: "include", taxName: "Wine", isVegan: true, status: "sold_out" }),
    );
    expect(toastSuccess).toHaveBeenCalledWith("Saved successfully");
  });

  test("lists the file's problems and saves nothing", () => {
    render(<MenuImportDialog file={{ name: "bad.csv", text: csv("Mains,Soup,abc,0,,,,0,2") }} onClose={vi.fn()} />);
    expect(screen.getByRole("alert").textContent).toContain("Line 2: Price must be a number, 0 or more.");
    expect((screen.getByRole("button", { name: "Import" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
