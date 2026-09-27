/**
 * Applying real-time events to the workspace's lists without refetching.
 * Each returns the same array when nothing changes (e.g. a device's own echo),
 * so React skips the re-render and nothing downstream refetches.
 */

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** `item` replacing the entry with its id, or added first when new. */
export function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [item, ...list];
  if (same(list[i], item)) return list;
  const next = list.slice();
  next[i] = item;
  return next;
}

export function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.some((x) => x.id === id) ? list.filter((x) => x.id !== id) : list;
}

/**
 * Whether an event's row is newer than the last one applied for that id, by
 * `updated_at`, so an event that arrives late can't undo a newer change.
 * Rows without a timestamp are always applied. Records what it accepts.
 */
export function isNewer(seen: Map<string, number>, id: string, updatedAt: string | undefined): boolean {
  if (!updatedAt) return true;
  const t = new Date(updatedAt).getTime();
  const last = seen.get(id);
  if (last !== undefined && t < last) return false;
  seen.set(id, t);
  return true;
}
