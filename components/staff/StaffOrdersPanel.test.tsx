import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { axeViolations } from "@/test/axe";
import type { Order } from "@/lib/types";

const order = (id: string, status: string, tableName: string): Order => ({
  id,
  code: `ORD-${id}`,
  tableName,
  lines: [{ id: `l${id}`, itemId: "d1", name: "Pepsi", qty: 2, price: 12 }],
  total: 24,
  taxRate: 10,
  ts: new Date("2026-09-29T19:05:00").getTime(),
  status,
  closedTs: null,
  sessionId: null,
});

vi.mock("@/components/providers/WorkspaceProvider", () => ({
  useWorkspace: () => ({
    workspace: {
      orders: [order("1", "New", "Table 4"), order("2", "Preparing", "Table 1")],
      tables: [],
      dishes: [],
    },
    flow: ["New", "Preparing", "Served", "Paid"],
    fmt: (v: number) => `€${v.toFixed(2)}`,
    addOrder: vi.fn(),
    advanceOrder: vi.fn(),
    deleteOrder: vi.fn(),
    setOrderLineQty: vi.fn(),
    addOrderLine: vi.fn(),
  }),
}));

import { StaffOrdersPanel } from "./StaffOrdersPanel";

afterEach(cleanup);

describe("StaffOrdersPanel", () => {
  test("shows each open order as a ticket headed by its table", () => {
    render(<StaffOrdersPanel />);
    const ticket = screen.getByRole("listitem", { name: "Table 4, ORD-1, New" });
    expect(ticket.textContent).toContain("Opened 19:05");
    expect(ticket.textContent).toContain("2×Pepsi");
    expect(ticket.textContent).toContain("Total€24.00");
  });

  test("only orders the kitchen hasn't started get the saffron strip", () => {
    render(<StaffOrdersPanel />);
    expect(screen.getByRole("listitem", { name: /ORD-1, New/ }).className).toContain("border-t-[#f0b232]");
    expect(screen.getByRole("listitem", { name: /ORD-2, Preparing/ }).className).not.toContain("border-t-[#f0b232]");
  });

  test("has no axe violations", async () => {
    const { container } = render(<StaffOrdersPanel />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
