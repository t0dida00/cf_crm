import type { TFunction } from "i18next";

/**
 * An order status ("New", "Paid"…) in the language in use. Statuses are
 * stored on orders as English words; an unknown one (a custom flow) shows as stored.
 */
export function statusLabel(t: TFunction, status: string): string {
  const key = `common.status.${status}` as const;
  return t(key as never, { defaultValue: status }) as string;
}
