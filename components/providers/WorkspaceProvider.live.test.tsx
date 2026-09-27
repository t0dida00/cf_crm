import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// A fake Pusher channel: tests fire events at the handlers the provider binds.
const handlers = vi.hoisted(() => new Map<string, (payload: unknown) => void>());
const channel = vi.hoisted(() => ({
  bind: (event: string, fn: (payload: unknown) => void) => handlers.set(event, fn),
  unbind: (event: string) => handlers.delete(event),
}));
vi.mock("@/hooks/usePlatformSocket", () => ({
  usePlatformSocket: (platformId: string | null) => (platformId ? channel : null),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const apiOrder = (id: string, status = "Received", updated_at = "2026-09-27T10:00:00Z") => ({
  id,
  code: `ORD-${id}`,
  table_name: "Table 3",
  total: "3.00",
  tax_rate: "0",
  status,
  ts: "2026-09-27T09:00:00Z",
  closed_ts: null,
  session_id: "s1",
  order_lines: [{ id: `l-${id}`, item_id: "d1", name: "Cola", price: "3.00", qty: 1, note: null }],
  updated_at,
});
const apiTable = (state: string) => ({ id: "t1", name: "Table 3", seats: 4, zone: "Main", state, seated_at: null });

const calls: string[] = [];
let serverOrders: unknown[] = [];
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(async (path: string, init?: { method?: string }) => {
    calls.push(`${init?.method ?? "GET"} ${path}`);
    if (path.startsWith("/settings")) return { settings: { currency: "€", taxRate: 0, specialTaxes: [] } };
    if (path === "/orders" && init?.method === "POST") return { order: apiOrder("new") };
    if (path.startsWith("/orders")) return { orders: serverOrders };
    if (path.startsWith("/tables")) return { tables: [apiTable("Seated")] };
    return { [path.slice(1).split("?")[0]]: [] };
  }),
}));

import { useWorkspace, WorkspaceProvider } from "./WorkspaceProvider";

let renders = 0;
function Probe() {
  const { workspace, status, placeOrder } = useWorkspace();
  renders++;
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="orders">{workspace.orders.map((o) => `${o.id}:${o.status}`).join(",")}</span>
      <span data-testid="tables">{workspace.tables.map((t) => `${t.name}:${t.state}`).join(",")}</span>
      <button onClick={() => void placeOrder("Table 3", [{ itemId: "d1", qty: 1 }])}>place</button>
    </div>
  );
}

const text = (id: string) => screen.getByTestId(id).textContent;
const fire = (event: string, payload: unknown) => act(() => handlers.get(event)?.(payload));

beforeEach(async () => {
  handlers.clear();
  calls.length = 0;
  serverOrders = [];
  vi.spyOn(globalThis, "fetch").mockImplementation(
    async () =>
      new Response(
        JSON.stringify({
          platform: { id: "p1", name: "Casa", phone: null, email: null, address: null, logo_url: null, platform_types: { code: "CAFE" } },
          role: "OWNER",
          pusher: null,
        }),
        { status: 200 },
      ),
  );
  render(
    <QueryClientProvider client={new QueryClient()}>
      <WorkspaceProvider signedIn>
        <Probe />
      </WorkspaceProvider>
    </QueryClientProvider>,
  );
  await waitFor(() => expect(text("status")).toBe("success"));
  await waitFor(() => expect(handlers.has("order:created")).toBe(true));
  calls.length = 0;
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("WorkspaceProvider live updates", () => {
  test("applies a new order and its changes from the events, without refetching", () => {
    fire("order:created", { order: apiOrder("o1") });
    expect(text("orders")).toBe("o1:Received");
    fire("order:updated", { order: apiOrder("o1", "Preparing", "2026-09-27T10:00:05Z") });
    expect(text("orders")).toBe("o1:Preparing");
    expect(calls).toEqual([]);
  });

  test("a repeated event (a device's own echo) doesn't re-render", () => {
    fire("order:created", { order: apiOrder("o1") });
    const before = renders;
    fire("order:updated", { order: apiOrder("o1") });
    expect(renders).toBe(before);
  });

  test("an event that arrives late can't undo a newer change", () => {
    fire("order:updated", { order: apiOrder("o1", "Preparing", "2026-09-27T10:00:05Z") });
    fire("order:updated", { order: apiOrder("o1", "Received", "2026-09-27T10:00:01Z") });
    expect(text("orders")).toBe("o1:Preparing");
  });

  test("applies deleted orders and table changes", () => {
    fire("order:created", { order: apiOrder("o1") });
    fire("order:deleted", { id: "o1" });
    expect(text("orders")).toBe("");
    fire("table:updated", { table: apiTable("Seated") });
    expect(text("tables")).toBe("Table 3:Seated");
    expect(calls).toEqual([]);
  });

  test("a check-out refetches once, even for a burst", async () => {
    serverOrders = [];
    fire("table:checked_out", { tableId: "t1", tableName: "Table 3" });
    fire("table:checked_out", { tableId: "t2", tableName: "Table 4" });
    await waitFor(() => expect(calls).toEqual(["GET /orders", "GET /tables"]));
  });

  test("placing an order applies it and refetches only the tables", async () => {
    act(() => screen.getByText("place").click());
    await waitFor(() => expect(text("orders")).toBe("new:Received"));
    expect(calls).toEqual(["POST /orders", "GET /tables"]);
  });
});
