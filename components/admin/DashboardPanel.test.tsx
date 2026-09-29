import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { axeViolations } from "@/test/axe";
import type { OrderStats } from "@/hooks/useOrderStats";

const statsResult = vi.hoisted(() => ({
  current: {} as { stats: OrderStats; status: string; error: string | null; retry: () => void },
}));

vi.mock("@/components/providers/WorkspaceProvider", () => ({
  useWorkspace: () => ({
    workspace: {
      bookings: [
        { id: "b1", name: "Ana", time: "20:00", party: 4, tableName: null, status: "Confirmed", date: "", ts: Date.now() },
        { id: "b2", name: "Luis", time: "21:00", party: 2, tableName: null, status: "Confirmed", date: "", ts: Date.now() },
      ],
    },
    fmt: (v: number) => `€${v.toFixed(2)}`,
    currency: "EUR",
  }),
}));
vi.mock("@/hooks/useOrderStats", () => ({ useOrderStats: () => statsResult.current }));
vi.mock("@/hooks/useOrderSeries", () => ({
  useOrderSeries: () => ({ series: [], status: "success", error: null, retry: vi.fn() }),
}));
// Chart.js needs a canvas; the chart has its own tests.
vi.mock("./TakingsChart", () => ({ TakingsChart: () => null }));
vi.mock("@/components/orders/SessionDetailDialog", () => ({ SessionDetailDialog: () => null }));

import { DashboardPanel, TAKINGS_HEADING } from "./DashboardPanel";

const STATS: OrderStats = {
  orderCount: 4,
  takings: 360,
  recent: [],
  bestsellers: [
    { itemId: "a", name: "Seafood paella", qty: 10, takings: 240 },
    { itemId: "b", name: "Crema catalana", qty: 20, takings: 120 },
  ],
  oldestTs: Date.now() - 86_400_000,
};

beforeEach(() => {
  statsResult.current = { stats: STATS, status: "success", error: null, retry: vi.fn() };
});
afterEach(cleanup);

describe("DashboardPanel", () => {
  test("leads with the takings for the range, then what they're made of", () => {
    render(<DashboardPanel />);
    const takings = within(screen.getByRole("region", { name: TAKINGS_HEADING.month }));
    expect(takings.getByText("€360.00")).toBeTruthy();
    expect(takings.getByText("4 orders")).toBeTruthy();
    expect(takings.getByText("€90.00 average order")).toBeTruthy();
    expect(takings.getByText("2 bookings, 6 guests")).toBeTruthy();
  });

  test("the heading follows the chosen range", () => {
    render(<DashboardPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(screen.getByRole("heading", { name: TAKINGS_HEADING.today })).toBeTruthy();
  });

  test("scales each best seller's bar to the top seller's takings", () => {
    render(<DashboardPanel />);
    const list = screen.getAllByRole("listitem").filter((li) => li.textContent?.includes("sold"));
    expect(list.map((li) => li.textContent)).toEqual([
      "Seafood paella€240.0010 sold",
      "Crema catalana€120.0020 sold",
    ]);
    const widths = list.map((li) => (li.querySelector("[style]") as HTMLElement).style.width);
    expect(widths).toEqual(["100%", "50%"]);
  });

  test("shows a dash, not zero, while the first figures load", () => {
    statsResult.current = {
      stats: { ...STATS, orderCount: 0, takings: 0, bestsellers: [], oldestTs: null },
      status: "loading",
      error: null,
      retry: vi.fn(),
    };
    render(<DashboardPanel />);
    const takings = within(screen.getByRole("region", { name: TAKINGS_HEADING.month }));
    expect(takings.getByText("—")).toBeTruthy();
    expect(takings.queryByText("€0.00")).toBeNull();
  });

  test("a failed load says so in the takings block and offers a retry", () => {
    const retry = vi.fn();
    statsResult.current = { stats: STATS, status: "error", error: "Couldn't load dashboard figures.", retry };
    render(<DashboardPanel />);
    const takings = within(screen.getByRole("region", { name: TAKINGS_HEADING.month }));
    expect(takings.getByRole("alert").textContent).toMatch(/Couldn't load dashboard figures/);
    fireEvent.click(takings.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalled();
  });

  test("has no axe violations", async () => {
    const { container } = render(<DashboardPanel />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
