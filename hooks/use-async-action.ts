"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Tracks in-flight async actions by key, so a button can show a spinner (via
 * `<Button loading={isPending(key)}>`) while its own click is running,
 * without one row's click disabling every other row's button.
 *
 * `run(key, fn)` awaits `fn`, marks `key` pending for the duration, and
 * reports a thrown error as a toast — the same fire-and-forget onClick shape
 * as before (`onClick={() => run(id, () => advanceOrder(id))}`), just with
 * visible pending/error state instead of a silent, unguarded promise.
 * Resolves to `true` on success / `false` on a caught error, so a caller that
 * needs a follow-up only on success (e.g. closing a dialog) can `await` it.
 */
export function useAsyncAction() {
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(new Set());
  const countsRef = useRef(new Map<string, number>());

  const setPending = (key: string, delta: 1 | -1) => {
    const counts = countsRef.current;
    const next = (counts.get(key) ?? 0) + delta;
    if (next <= 0) counts.delete(key);
    else counts.set(key, next);
    setPendingKeys(new Set(counts.keys()));
  };

  const run = useCallback(async (key: string, fn: () => Promise<unknown>, errorMessage?: string) => {
    setPending(key, 1);
    try {
      await fn();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : errorMessage || "Something went wrong.");
      return false;
    } finally {
      setPending(key, -1);
    }
  }, []);

  const isPending = useCallback((key: string) => pendingKeys.has(key), [pendingKeys]);

  return { run, isPending };
}
