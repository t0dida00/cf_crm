import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/lib/api", () => ({
  apiFetch: vi.fn(async (path: string) => {
    if (path.startsWith("/settings")) return { settings: { currency: "€", taxRate: 0, specialTaxes: [] } };
    const key = path.slice(1).split("?")[0];
    return { [key]: [] };
  }),
}));

import { toast } from "sonner";
import { useWorkspace, WorkspaceProvider } from "./WorkspaceProvider";

let platformName = "Casa";
let failPlatform = false;

function Probe() {
  const { workspace, status, reload, refresh } = useWorkspace();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="name">{workspace.name}</span>
      <button onClick={reload}>reload</button>
      <button onClick={refresh}>refresh</button>
    </div>
  );
}

const renderProvider = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <WorkspaceProvider signedIn>
        <Probe />
      </WorkspaceProvider>
    </QueryClientProvider>,
  );

beforeEach(() => {
  platformName = "Casa";
  failPlatform = false;
  vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
    failPlatform
      ? new Response("{}", { status: 500 })
      : new Response(
          JSON.stringify({
            platform: { id: "p1", name: platformName, phone: null, email: null, address: null, logo_url: null, platform_types: { code: "CAFE" } },
            role: "OWNER",
            pusher: null,
          }),
          { status: 200 },
        ),
  );
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const status = () => screen.getByTestId("status").textContent;
const name = () => screen.getByTestId("name").textContent;

describe("WorkspaceProvider reload vs refresh", () => {
  test("reload shows the loading state", async () => {
    renderProvider();
    await waitFor(() => expect(status()).toBe("success"));
    act(() => screen.getByText("reload").click());
    expect(status()).toBe("loading");
    await waitFor(() => expect(status()).toBe("success"));
  });

  test("refresh keeps the page up, then swaps in the new data", async () => {
    renderProvider();
    await waitFor(() => expect(name()).toBe("Casa"));

    platformName = "Casa Nova";
    act(() => screen.getByText("refresh").click());
    expect(status()).toBe("success");
    expect(name()).toBe("Casa");
    await waitFor(() => expect(name()).toBe("Casa Nova"));
    expect(status()).toBe("success");
  });

  test("a failed refresh keeps the current data and shows a toast", async () => {
    renderProvider();
    await waitFor(() => expect(name()).toBe("Casa"));

    failPlatform = true;
    act(() => screen.getByText("refresh").click());
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(status()).toBe("success");
    expect(name()).toBe("Casa");
  });
});
