import type { TableRec } from "./types";

/** Whether a table has a zone: blank and the "—" placeholder both mean none. */
export const hasZone = (zone: string) => zone.trim() !== "" && zone !== "—";

/** Tables grouped by zone, in the workspace's zone order; tables without one
 * come last, under zone "". The admin and staff floor plans both use it. */
export function groupByZone(tables: TableRec[], zones: string[]): { zone: string; tables: TableRec[] }[] {
  const order = [...zones, ...tables.map((t) => t.zone)].filter(hasZone);
  const groups = [...new Set(order)]
    .map((zone) => ({ zone, tables: tables.filter((t) => t.zone === zone) }))
    .filter((g) => g.tables.length);
  const loose = tables.filter((t) => !hasZone(t.zone));
  return loose.length ? [...groups, { zone: "", tables: loose }] : groups;
}
