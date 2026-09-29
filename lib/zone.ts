/** Whether a table has a zone: blank and the "—" placeholder both mean none. */
export const hasZone = (zone: string) => zone.trim() !== "" && zone !== "—";
