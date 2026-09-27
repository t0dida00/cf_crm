/**
 * Whether a real-time event concerns `tableName`: order events carry the
 * order (`order.table_name`), checkouts carry `tableName`. The channel is the
 * whole restaurant's, so a guest's phone skips other tables' events instead
 * of refetching on every one. An event without a table name counts as
 * relevant, so nothing is missed.
 */
export function eventIsForTable(payload: unknown, tableName: string): boolean {
  const p = payload as { order?: { table_name?: unknown }; tableName?: unknown } | null | undefined;
  const name = p?.order?.table_name ?? p?.tableName;
  return typeof name !== "string" || name === tableName;
}
