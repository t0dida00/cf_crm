import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const replace = vi.fn();
const reload = vi.fn();
const createPlatformAction = vi.fn(async () => {});
const updatePlatformAction = vi.fn(async () => {});
let workspace = { name: "" };
let hydrated = true;

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/app/actions", () => ({
  createPlatformAction: (...args: unknown[]) => createPlatformAction(...(args as [])),
  updatePlatformAction: (...args: unknown[]) => updatePlatformAction(...(args as [])),
}));
vi.mock("@/components/workspace-provider", () => ({ useWorkspace: () => ({ workspace, hydrated, reload }) }));
vi.mock("@/components/setup-screen", () => ({
  SetupScreen: ({
    onSubmit,
    initial,
  }: {
    onSubmit: (n: string, d: string, c: object) => Promise<void>;
    initial?: { name: string } | null;
  }) => (
    <div>
      <span data-testid="initial-name">{initial?.name ?? ""}</span>
      <button onClick={() => onSubmit(initial ? "Casa Nova" : "Casa", "cafe", { phone: "1" })}>Build my workspace</button>
    </div>
  ),
}));
vi.mock("@/components/connections-step", () => ({
  ConnectionsStep: ({ onContinue, onBack }: { onContinue: () => void; onBack?: () => void }) => (
    <div>
      <button onClick={onBack}>Back</button>
      <button onClick={onContinue}>Use the shared service for now</button>
    </div>
  ),
}));
vi.mock("@/components/building-screen", () => ({
  BuildingScreen: ({ onDone }: { onDone: () => void }) => <button onClick={onDone}>Finish building</button>,
}));

import { WorkspaceSetupFlow } from "./workspace-setup-flow";

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  workspace = { name: "" };
  hydrated = true;
});

describe("WorkspaceSetupFlow", () => {
  test("creates the business, then shows the connections step without leaving setup", async () => {
    render(<WorkspaceSetupFlow />);
    await act(async () => fireEvent.click(screen.getByText("Build my workspace")));
    expect(createPlatformAction).toHaveBeenCalledWith({ name: "Casa", domain: "cafe", phone: "1" });
    expect(screen.getByText("Use the shared service for now")).toBeTruthy();
    expect(reload).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  test("after building, reloads the workspace and opens /admin once the business has loaded", async () => {
    const { rerender } = render(<WorkspaceSetupFlow />);
    await act(async () => fireEvent.click(screen.getByText("Build my workspace")));
    fireEvent.click(screen.getByText("Use the shared service for now"));
    fireEvent.click(screen.getByText("Finish building"));

    // The workspace was loaded before the business existed: it must be reloaded.
    expect(reload).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Opening your workspace…")).toBeTruthy();

    // Reload in flight, then done with the new business.
    hydrated = false;
    rerender(<WorkspaceSetupFlow />);
    expect(screen.getByText("Opening your workspace…")).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
    hydrated = true;
    workspace = { name: "Casa" };
    rerender(<WorkspaceSetupFlow />);
    expect(replace).toHaveBeenCalledWith("/admin");
  });

  test("Back returns to step 1 with the saved details, and resubmitting updates instead of creating", async () => {
    render(<WorkspaceSetupFlow />);
    await act(async () => fireEvent.click(screen.getByText("Build my workspace")));
    fireEvent.click(screen.getByText("Back"));

    expect(screen.getByTestId("initial-name").textContent).toBe("Casa");
    await act(async () => fireEvent.click(screen.getByText("Build my workspace")));

    expect(createPlatformAction).toHaveBeenCalledTimes(1);
    expect(updatePlatformAction).toHaveBeenCalledWith({ name: "Casa Nova", domain: "cafe", phone: "1" });
    expect(screen.getByText("Use the shared service for now")).toBeTruthy();
  });

  test("an owner who already has a business goes straight to /admin", () => {
    workspace = { name: "Casa" };
    render(<WorkspaceSetupFlow />);
    expect(replace).toHaveBeenCalledWith("/admin");
  });
});
