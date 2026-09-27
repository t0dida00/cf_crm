import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ConnectionsInput } from "@/hooks/use-connections";

const replace = vi.fn();
const reload = vi.fn();
const createPlatformAction = vi.fn(async (_d: object) => {});
const updatePlatformAction = vi.fn(async (_d: object) => {});
const saveConnections = vi.fn(async (_i: ConnectionsInput) => ({}));
const uploadImage = vi.fn(async (_f: File) => "https://cdn.example.com/logo.png");
const toastError = vi.fn();
let workspace = { name: "" };
let hydrated = true;
let logoFile: File | null = null;

const CHECKED: ConnectionsInput = {
  databaseUrl: "postgresql://u:p@db.example.com/shop",
  pusher: { appId: "42", key: "abcdef123456", secret: "fedcba654321", cluster: "eu" },
  storage: { provider: "vercel_blob", token: "vercel_blob_rw_store_secret" },
};

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { error: (m: string) => toastError(m), success: vi.fn() } }));
vi.mock("@/app/actions", () => ({
  createPlatformAction: (d: object) => createPlatformAction(d),
  updatePlatformAction: (d: object) => updatePlatformAction(d),
}));
vi.mock("@/lib/upload-image", () => ({ uploadImage: (f: File) => uploadImage(f) }));
vi.mock("@/hooks/use-connections", () => ({
  useConnections: () => ({ saveConnections: { mutateAsync: (i: ConnectionsInput) => saveConnections(i) } }),
}));
vi.mock("@/components/workspace-provider", () => ({ useWorkspace: () => ({ workspace, hydrated, reload }) }));
vi.mock("@/components/setup-screen", () => ({
  SetupScreen: ({
    onSubmit,
    onBack,
    initial,
  }: {
    onSubmit: (n: string, d: string, c: object) => Promise<void>;
    onBack: () => void;
    initial?: { name: string } | null;
  }) => (
    <div>
      <span>Details step</span>
      <span data-testid="initial-name">{initial?.name ?? ""}</span>
      <button onClick={onBack}>Back</button>
      <button onClick={() => onSubmit(initial ? "Casa Nova" : "Casa", "cafe", { phone: "1", logoUrl: "", logoFile })}>
        Build my workspace
      </button>
    </div>
  ),
}));
vi.mock("@/components/connections-step", () => ({
  ConnectionsStep: ({
    onContinue,
    onSkip,
    onChecked,
    checked,
    error,
  }: {
    onContinue: () => void;
    onSkip: () => void;
    onChecked?: (i: ConnectionsInput) => void;
    checked: ConnectionsInput | null;
    error: string | null;
  }) => (
    <div>
      <span>Connections step</span>
      <span data-testid="mode">{onChecked ? "check" : "save"}</span>
      <span data-testid="checked">{checked?.databaseUrl ?? ""}</span>
      <span data-testid="error">{error ?? ""}</span>
      {onChecked && <button onClick={() => onChecked(CHECKED)}>Test & continue</button>}
      <button onClick={onSkip}>Use the shared service for now</button>
      <button onClick={onContinue}>Continue</button>
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
  logoFile = null;
});

const click = (text: string) => act(async () => fireEvent.click(screen.getByText(text)));

describe("WorkspaceSetupFlow", () => {
  test("starts with the connections step, which only checks while the business doesn't exist", () => {
    render(<WorkspaceSetupFlow />);
    expect(screen.getByText("Connections step")).toBeTruthy();
    expect(screen.getByTestId("mode").textContent).toBe("check");
    expect(createPlatformAction).not.toHaveBeenCalled();
  });

  test("checked connections are saved right after step 2 creates the business", async () => {
    render(<WorkspaceSetupFlow />);
    await click("Test & continue");
    expect(screen.getByText("Details step")).toBeTruthy();
    expect(saveConnections).not.toHaveBeenCalled();

    await click("Build my workspace");

    expect(createPlatformAction).toHaveBeenCalledWith({ name: "Casa", domain: "cafe", phone: "1", logoUrl: "" });
    expect(saveConnections).toHaveBeenCalledWith(CHECKED);
    expect(createPlatformAction.mock.invocationCallOrder[0]).toBeLessThan(saveConnections.mock.invocationCallOrder[0]);
    expect(screen.getByText("Finish building")).toBeTruthy();
  });

  test("on the shared service, nothing is connected", async () => {
    render(<WorkspaceSetupFlow />);
    await click("Use the shared service for now");
    await click("Build my workspace");
    expect(createPlatformAction).toHaveBeenCalled();
    expect(saveConnections).not.toHaveBeenCalled();
    expect(screen.getByText("Finish building")).toBeTruthy();
  });

  test("the logo is uploaded after the connections are saved, then set on the business", async () => {
    logoFile = new File(["png"], "logo.png", { type: "image/png" });
    render(<WorkspaceSetupFlow />);
    await click("Test & continue");
    await click("Build my workspace");

    expect(uploadImage).toHaveBeenCalledWith(logoFile);
    expect(saveConnections.mock.invocationCallOrder[0]).toBeLessThan(uploadImage.mock.invocationCallOrder[0]);
    expect(updatePlatformAction).toHaveBeenCalledWith(expect.objectContaining({ logoUrl: "https://cdn.example.com/logo.png" }));
  });

  test("a failed logo upload doesn't stop setup", async () => {
    logoFile = new File(["png"], "logo.png", { type: "image/png" });
    uploadImage.mockRejectedValueOnce(new Error("Image must be smaller than 4MB."));
    render(<WorkspaceSetupFlow />);
    await click("Use the shared service for now");
    await click("Build my workspace");

    expect(toastError).toHaveBeenCalledWith(expect.stringMatching(/Couldn't upload your logo.*4MB.*later in Settings/));
    expect(screen.getByText("Finish building")).toBeTruthy();
  });

  test("if saving the connections fails, goes back to step 1 (now saving directly) with the reason and the details kept", async () => {
    saveConnections.mockRejectedValueOnce(new Error("This database already has tables. Use an empty database."));
    render(<WorkspaceSetupFlow />);
    await click("Test & continue");
    await click("Build my workspace");

    expect(screen.getByText("Connections step")).toBeTruthy();
    expect(screen.getByTestId("mode").textContent).toBe("save");
    expect(screen.getByTestId("error").textContent).toMatch(/business was created.*already has tables/);
    expect(screen.getByTestId("checked").textContent).toBe(CHECKED.databaseUrl);

    // Saved from step 1 this time: step 2 updates the business and doesn't save them again.
    await click("Continue");
    await click("Build my workspace");
    expect(createPlatformAction).toHaveBeenCalledTimes(1);
    expect(updatePlatformAction).toHaveBeenCalledWith(expect.objectContaining({ name: "Casa Nova" }));
    expect(saveConnections).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Finish building")).toBeTruthy();
  });

  test("Back from step 2 keeps what was checked", async () => {
    render(<WorkspaceSetupFlow />);
    await click("Test & continue");
    await click("Back");
    expect(screen.getByTestId("checked").textContent).toBe(CHECKED.databaseUrl);
    await click("Continue");
    await click("Build my workspace");
    expect(saveConnections).toHaveBeenCalledWith(CHECKED);
  });

  test("after building, reloads the workspace and opens /admin once the business has loaded", async () => {
    const { rerender } = render(<WorkspaceSetupFlow />);
    await click("Use the shared service for now");
    await click("Build my workspace");
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

  test("an owner who already has a business goes straight to /admin", () => {
    workspace = { name: "Casa" };
    render(<WorkspaceSetupFlow />);
    expect(replace).toHaveBeenCalledWith("/admin");
  });
});
