import type { Order, OrderLine } from "./types";

export const lineTotal = (lines: OrderLine[]) =>
  lines.reduce((a, l) => a + l.price * l.qty, 0);

/** Merges same-name lines (across one or several orders) into a single
 * qty for a compact summary, e.g. "23× Coca Cola" instead of listing every
 * individual round separately. */
export function summariseLines(lines: OrderLine[]): { name: string; qty: number }[] {
  const byName = new Map<string, number>();
  for (const line of lines) {
    byName.set(line.name, (byName.get(line.name) ?? 0) + line.qty);
  }
  return Array.from(byName, ([name, qty]) => ({ name, qty }));
}

export interface OrderSession {
  /** Orders that were part of the same dining party (same sessionId, or a
   * single legacy order with no sessionId), newest first. */
  orders: Order[];
  ts: number;
  closedTs: number | null;
  total: number;
}

const toSession = (orders: Order[]): OrderSession => {
  const sorted = [...orders].sort((a, b) => b.ts - a.ts);
  const closedTs = sorted.every((o) => o.closedTs !== null)
    ? Math.max(...sorted.map((o) => o.closedTs as number))
    : null;
  return {
    orders: sorted,
    ts: Math.max(...sorted.map((o) => o.ts)),
    closedTs,
    total: sorted.reduce((sum, o) => sum + o.total, 0),
  };
};

/**
 * Groups a table's orders into sessions — every order placed between two
 * checkouts shares a `sessionId` (set by the backend), so they collapse into
 * one entry with a combined total, since guests experience them as one bill.
 * Orders with no sessionId (placed before sessions existed) each stay their
 * own session.
 */
export function groupOrdersIntoSessions(orders: Order[], tableName: string): OrderSession[] {
  return groupIntoSessions(orders.filter((o) => o.tableName === tableName));
}

/** Same grouping, but across every table — for a workspace-wide history view. */
export function groupIntoSessions(orders: Order[]): OrderSession[] {
  const bySessionId = new Map<string, Order[]>();
  const standalone: Order[] = [];

  for (const order of orders) {
    if (!order.sessionId) {
      standalone.push(order);
      continue;
    }
    const group = bySessionId.get(order.sessionId);
    if (group) group.push(order);
    else bySessionId.set(order.sessionId, [order]);
  }

  const sessions = [
    ...standalone.map((o) => toSession([o])),
    ...Array.from(bySessionId.values()).map(toSession),
  ];

  return sessions.sort((a, b) => b.ts - a.ts);
}
