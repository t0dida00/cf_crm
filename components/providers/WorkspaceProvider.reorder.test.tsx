import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const api = vi.hoisted(() => ({ failOrder: false, calls: [] as { path: string; init?: RequestInit }[] }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(async (path: string, init?: RequestInit) => {
    api.calls.push({ path, init });
    if (path === "/categories/order") {
      if (api.failOrder) throw new Error("Network down");
      return {};
    }
    if (path.startsWith("/settings")) return { settings: { currency: "€", taxRate: 0, specialTaxes: [] } };
    if (path.startsWith("/categories")) {
      return {
        categories: [
          { id: "a", name: "Starters", is_active: true },
          { id: "b", name: "Mains", is_active: true },
          { id: "c", name: "Desserts", is_active: true },
        ],
      };
    }
    return { [path.slice(1).split("?")[0]]: [] };
  }),
}));

import { useWorkspace, WorkspaceProvider } from "./WorkspaceProvider";

let outcome = "";
function Probe() {
  const { workspace, reorderCategories } = useWorkspace();
  return (
    <div>
      <span data-testid="order">{workspace.categories.map((c) => c.name).join(",")}</span>
      <button
        onClick={() =>
          reorderCategories(["c", "a", "b"]).then(
            () => (outcome = "saved"),
            () => (outcome = "failed"),
          )
        }
      >
        reorder
      </button>
    </div>
  );
}

const order = () => screen.getByTestId("order").textContent;

beforeEach(() => {
  api.failOrder = false;
  api.calls = [];
  outcome = "";
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
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("reorderCategories", () => {
  test("shows the new order at once and saves every id in it", async () => {
    await waitFor(() => expect(order()).toBe("Starters,Mains,Desserts"));
    act(() => screen.getByText("reorder").click());
    expect(order()).toBe("Desserts,Starters,Mains");
    await waitFor(() => expect(outcome).toBe("saved"));
    const put = api.calls.find((c) => c.path === "/categories/order");
    expect(put?.init?.method).toBe("PUT");
    expect(JSON.parse(String(put?.init?.body))).toEqual({ ids: ["c", "a", "b"] });
  });

  test("puts the old order back when the save fails", async () => {
    await waitFor(() => expect(order()).toBe("Starters,Mains,Desserts"));
    api.failOrder = true;
    act(() => screen.getByText("reorder").click());
    await waitFor(() => expect(outcome).toBe("failed"));
    expect(order()).toBe("Starters,Mains,Desserts");
  });
});
