import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { axeViolations } from "@/test/axe";
import type { TableRec } from "@/lib/types";
import { chairLayout, MAX_DRAWN_CHAIRS, TableTile } from "./TableTile";

afterEach(cleanup);

const TABLE: TableRec = { id: "7", name: "Table 7", seats: 6, zone: "Bar", state: "Seated", seatedAt: 1 };

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

describe("TableTile", () => {
  test("names the table and its seats, and shows the app's footer", () => {
    render(
      <ul>
        <TableTile table={TABLE} footer={<span>Guests seated</span>} />
      </ul>,
    );
    expect(screen.getByText("Table 7")).toBeTruthy();
    expect(screen.getByText("6 seats")).toBeTruthy();
    expect(screen.getByText("Guests seated")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  test("with onOpen, the whole tile is one button", () => {
    const onOpen = vi.fn();
    render(
      <ul>
        <TableTile table={TABLE} tone="Seated" aside={<span>Seated</span>} footer={<span>Guests seated</span>} onOpen={onOpen} />
      </ul>,
    );
    const tile = screen.getByRole("button", { name: /Table 7/ });
    fireEvent.click(tile);
    expect(onOpen).toHaveBeenCalled();
    // Hovering outlines the tile in the table's own colour.
    expect(tile.className).toContain("hover:border-brand-700");
  });

  test("has no axe violations", async () => {
    const { container } = render(
      <ul>
        <TableTile table={TABLE} tone="Free" footer={<span>Ready for guests</span>} onOpen={vi.fn()} />
      </ul>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});
