import { describe, expect, test } from "vitest";
import type { TableRec } from "./types";
import { groupByZone, hasZone } from "./zone";

const table = (id: string, zone: string): TableRec => ({ id, name: `Table ${id}`, seats: 4, zone, state: "Free", seatedAt: null });

describe("hasZone", () => {
  test("a named zone counts; blank and the dash placeholder don't", () => {
    expect(hasZone("Terrace")).toBe(true);
    expect(hasZone("")).toBe(false);
    expect(hasZone("  ")).toBe(false);
    expect(hasZone("—")).toBe(false);
  });
});

describe("groupByZone", () => {
  test("follows the workspace's zone order and puts tables without a zone last", () => {
    const groups = groupByZone(
      [table("1", ""), table("2", "Bar"), table("3", "Terrace"), table("4", "Bar"), table("5", "—")],
      ["Terrace", "Bar"],
    );
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
