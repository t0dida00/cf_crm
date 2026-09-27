import { describe, expect, test } from "vitest";
import { eventIsForTable } from "./table-events";

describe("eventIsForTable", () => {
  test("matches this table's orders and checkout", () => {
    expect(eventIsForTable({ order: { table_name: "Table 3" } }, "Table 3")).toBe(true);
    expect(eventIsForTable({ tableId: "t3", tableName: "Table 3" }, "Table 3")).toBe(true);
  });

  test("skips other tables", () => {
    expect(eventIsForTable({ order: { table_name: "Table 5" } }, "Table 3")).toBe(false);
    expect(eventIsForTable({ tableName: "Table 5" }, "Table 3")).toBe(false);
  });

  test("never misses an event it can't place", () => {
    expect(eventIsForTable(undefined, "Table 3")).toBe(true);
    expect(eventIsForTable({ order: {} }, "Table 3")).toBe(true);
  });
});
