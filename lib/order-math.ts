import type { OrderLine } from "./types";

export const lineTotal = (lines: OrderLine[]) =>
  lines.reduce((a, l) => a + l.price * l.qty, 0);
