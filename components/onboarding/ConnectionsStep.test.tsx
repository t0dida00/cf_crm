import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Connections, ConnectionsInput } from "@/hooks/useConnections";

let connections: Connections | null = null;
vi.mock("@/app/actions", () => ({ signOutAction: vi.fn() }));
vi.mock("@/hooks/useConnections", () => ({ useConnections: () => ({ connections }) }));
vi.mock("./ConnectionsForm", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./ConnectionsForm")>()),
  ConnectionsForm: ({ onChecked }: { onChecked?: unknown }) => <div>form in {onChecked ? "check" : "save"} mode</div>,
}));

import { ConnectionsStep } from "./ConnectionsStep";

const base: Connections = { database: null, pusher: null, storage: null, sharedInfraAllowed: true, canStoreCredentials: true };
const CHECKED = { databaseUrl: "postgresql://x/db" } as ConnectionsInput;

afterEach(cleanup);
beforeEach(() => {
  connections = base;
});

describe("ConnectionsStep", () => {
  test("is step 1 of onboarding, with sign-out", () => {
    render(<ConnectionsStep onContinue={vi.fn()} onChecked={vi.fn()} />);
    expect(screen.getByText(/STEP 1 OF 2/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Sign out/ })).toBeTruthy();
    expect(screen.getByText("form in check mode")).toBeTruthy();
  });

  test("before anything is checked, offers only the shared service (Test & continue moves on)", () => {
    const onSkip = vi.fn();
    render(<ConnectionsStep onContinue={vi.fn()} onSkip={onSkip} onChecked={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /^Continue/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Use the shared service for now" }));
    expect(onSkip).toHaveBeenCalled();
  });

  test("coming back with checked connections, Continue keeps them", () => {
    const onContinue = vi.fn();
    connections = { ...base, sharedInfraAllowed: false };
    render(<ConnectionsStep onContinue={onContinue} onChecked={vi.fn()} checked={CHECKED} />);
    expect(screen.queryByRole("button", { name: "Use the shared service for now" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Continue/ }));
    expect(onContinue).toHaveBeenCalled();
  });

  test("shows why saving failed", () => {
    render(<ConnectionsStep onContinue={vi.fn()} error="Your business was created, but connecting your services failed" />);
    expect(screen.getByRole("alert").textContent).toMatch(/connecting your services failed/);
    expect(screen.getByText("form in save mode")).toBeTruthy();
  });

  test("once the business exists and the shared service is off, Continue waits for all three", () => {
    connections = { ...base, sharedInfraAllowed: false };
    render(<ConnectionsStep onContinue={vi.fn()} />);
    expect((screen.getByRole("button", { name: /^Continue/ }) as HTMLButtonElement).disabled).toBe(true);
  });
});
