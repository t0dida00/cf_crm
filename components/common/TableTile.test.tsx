import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { axeViolations } from "@/test/axe";
import type { TableRec } from "@/lib/types";
import { chairLayout, MAX_DRAWN_CHAIRS, TableTile } from "./TableTile";
import { groupByZone } from "./TablesPanel";

afterEach(cleanup);

const table = (id: string, zone: string, seats = 4): TableRec => ({
  id,
  name: `Table ${id}`,
  seats,
  zone,
  state: "Free",
  seatedAt: null,
});

describe("chairLayout", () => {
  test("puts half the chairs along the top and the rest along the bottom", () => {
    expect(chairLayout(4)).toEqual({ top: 2, bottom: 2 });
    expect(chairLayout(5)).toEqual({ top: 3, bottom: 2 });
    expect(chairLayout(1)).toEqual({ top: 1, bottom: 0 });
  });

  test("draws at most the cap, and at least one chair", () => {
    const big = chairLayout(40);
    expect(big.top + big.bottom).toBe(MAX_DRAWN_CHAIRS);
    expect(chairLayout(0)).toEqual({ top: 1, bottom: 0 });
  });
});

describe("groupByZone", () => {
  test("follows the workspace's zone order and puts tables without a zone last", () => {
    const groups = groupByZone([table("1", ""), table("2", "Bar"), table("3", "Terrace"), table("4", "Bar"), table("5", "—")], [
      "Terrace",
      "Bar",
    ]);
    expect(groups.map((g) => [g.zone, g.tables.map((t) => t.id)])).toEqual([
      ["Terrace", ["3"]],
      ["Bar", ["2", "4"]],
      ["", ["1", "5"]],
    ]);
  });

  test("keeps a zone missing from the list, and skips empty zones", () => {
    expect(groupByZone([table("1", "Garden")], ["Bar"]).map((g) => g.zone)).toEqual(["Garden"]);
  });
});

describe("TableTile", () => {
  test("names the table, its seats, and labels its actions", () => {
    const onHistory = vi.fn();
    const onEdit = vi.fn();
    render(
      <ul>
        <TableTile table={table("7", "Bar", 6)} onHistory={onHistory} onEdit={onEdit} />
      </ul>,
    );
    expect(screen.getByText("6 seats")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Orders at Table 7" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit Table 7" }));
    expect(onHistory).toHaveBeenCalled();
    expect(onEdit).toHaveBeenCalled();
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <ul>
        <TableTile table={table("1", "")} onHistory={vi.fn()} onEdit={vi.fn()} />
      </ul>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
