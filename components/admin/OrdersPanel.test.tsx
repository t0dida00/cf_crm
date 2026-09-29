import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { Order } from "@/lib/types";
import { toSession } from "@/lib/orderMath";

const downloadFile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/downloadFile", () => ({ downloadFile }));
vi.mock("@/components/orders/SessionDetailDialog", () => ({ SessionDetailDialog: () => null }));

const order: Order = {
  id: "o1",
  code: "ORD-7",
  tableName: "Bàn 5",
  lines: [{ id: "l1", itemId: "d1", name: 'Phở bò "đặc biệt"', qty: 2, price: 9.5 }],
  total: 19,
  taxRate: 10,
  ts: new Date("2026-09-29T19:00:00").getTime(),
  status: "Paid",
  closedTs: new Date("2026-09-29T20:00:00").getTime(),
  sessionId: null,
};

vi.mock("@/hooks/useOrderHistory", () => ({
  useOrderHistory: () => ({ sessions: [toSession([order])], total: 1, status: "success", error: null, retry: vi.fn() }),
}));
vi.mock("@/components/providers/WorkspaceProvider", () => ({
  useWorkspace: () => ({
    workspace: { name: "Quán Ngon", orders: [], tables: [], dishes: [] },
    flow: ["New", "Preparing", "Served", "Paid"],
    fmt: (v: number) => `€${v.toFixed(2)}`,
    addOrder: vi.fn(),
  }),
}));

import { OrdersPanel } from "./OrdersPanel";

afterEach(cleanup);

describe("OrdersPanel export", () => {
  test("saves the page as a UTF-8 CSV, with accents and quotes intact", () => {
    render(<OrdersPanel createSignal={0} />);
    fireEvent.click(screen.getByRole("button", { name: /Export page/ }));
    const [csv, fileName] = downloadFile.mock.calls[0];
    expect(fileName).toBe("quán-ngon-orders-page-1.csv");
    expect(csv).toContain("Bàn 5");
    // A quote inside a field is doubled, the field quoted: it reads back as written.
    expect(csv).toContain('"2× Phở bò ""đặc biệt"""');
  });
});
