import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { afterEach, describe, expect, test, vi } from "vitest";
import { DataTable } from "./data-table";

interface Row {
  id: string;
  name: string;
}
const helper = createColumnHelper<Row>();
const columns = [helper.accessor("name", { header: "Name" })];

function Harness({ onRowClick }: { onRowClick?: (row: Row) => void }) {
  const table = useReactTable({
    data: [
      { id: "1", name: "ORD-1" },
      { id: "2", name: "ORD-2" },
    ],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return <DataTable table={table} onRowClick={onRowClick} />;
}

const rowOf = (text: string) => screen.getByText(text).closest("tr")!;

describe("DataTable keyboard access", () => {
  // No vitest globals, so Testing Library can't register its own cleanup.
  afterEach(cleanup);

  test("clickable rows are focusable and open with Enter and Space", () => {
    const onRowClick = vi.fn();
    render(<Harness onRowClick={onRowClick} />);
    const row = rowOf("ORD-2");

    expect(row.tabIndex).toBe(0);
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.keyDown(row, { key: " " });
    expect(onRowClick).toHaveBeenCalledTimes(2);
    expect(onRowClick).toHaveBeenCalledWith({ id: "2", name: "ORD-2" });
  });

  test("other keys, and keys from elements inside the row, are ignored", () => {
    const onRowClick = vi.fn();
    render(<Harness onRowClick={onRowClick} />);

    fireEvent.keyDown(rowOf("ORD-1"), { key: "a" });
    fireEvent.keyDown(screen.getByText("ORD-1"), { key: "Enter" });
    expect(onRowClick).not.toHaveBeenCalled();
  });

  test("rows without a click handler stay out of the tab order", () => {
    render(<Harness />);
    expect(rowOf("ORD-1").hasAttribute("tabindex")).toBe(false);
  });
});
