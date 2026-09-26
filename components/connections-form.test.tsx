import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Connections } from "@/hooks/use-connections";

const mutateDb = vi.fn();
const mutatePusher = vi.fn();
let state: { connections: Connections | null; dbError: Error | null } = { connections: null, dbError: null };

vi.mock("@/hooks/use-connections", () => ({
  useConnections: () => ({
    connections: state.connections,
    status: state.connections ? "success" : "loading",
    error: null,
    retry: vi.fn(),
    saveDatabase: { mutate: mutateDb, isPending: false, error: state.dbError },
    savePusher: { mutate: mutatePusher, isPending: false, error: null },
  }),
}));

import { ConnectionsForm, connectionsReady } from "./connections-form";

const base: Connections = { database: null, pusher: null, sharedInfraAllowed: true, canStoreCredentials: true };

afterEach(cleanup);
beforeEach(() => {
  mutateDb.mockReset();
  mutatePusher.mockReset();
  state = { connections: base, dbError: null };
});

describe("ConnectionsForm", () => {
  test("tests and saves the database URL, then reports success", () => {
    const onSaved = vi.fn();
    mutateDb.mockImplementation((_url, opts) => opts.onSuccess());
    render(<ConnectionsForm onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText("Connection URL"), {
      target: { value: "  postgresql://u:p@db.example.com/shop  " },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Test & save" })[0]);

    expect(mutateDb).toHaveBeenCalledWith("postgresql://u:p@db.example.com/shop", expect.anything());
    expect(onSaved).toHaveBeenCalled();
  });

  test("shows the backend's reason when the database is refused", () => {
    state.dbError = new Error("This database already has tables. Use an empty database.");
    render(<ConnectionsForm />);
    expect(screen.getByRole("alert").textContent).toMatch(/already has tables/);
  });

  test("shows connected services by label only, with a replace option", () => {
    state.connections = {
      ...base,
      database: { label: "db.example.com/shop", verifiedAt: "2026-09-27T10:00:00Z" },
      pusher: { appId: "42", key: "abc", cluster: "eu", verifiedAt: null },
    };
    render(<ConnectionsForm />);
    expect(screen.getByText(/db\.example\.com\/shop/)).toBeTruthy();
    expect(screen.queryByLabelText("Connection URL")).toBeNull();
    expect(screen.getByRole("button", { name: "Replace database" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Replace Pusher app" })).toBeTruthy();
  });

  test("blocks saving when the server can't store credentials", () => {
    state.connections = { ...base, canStoreCredentials: false };
    render(<ConnectionsForm />);
    expect(screen.getByRole("alert").textContent).toMatch(/CREDENTIALS_KEY/);
    for (const button of screen.getAllByRole("button", { name: "Test & save" })) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
  });
});

describe("connectionsReady", () => {
  test("allows continuing on the shared service when it's allowed", () => {
    expect(connectionsReady(base)).toBe(true);
  });

  test("otherwise needs both a database and Pusher", () => {
    const own = { ...base, sharedInfraAllowed: false };
    expect(connectionsReady(own)).toBe(false);
    expect(connectionsReady({ ...own, database: { label: "x", verifiedAt: null } })).toBe(false);
    expect(
      connectionsReady({
        ...own,
        database: { label: "x", verifiedAt: null },
        pusher: { appId: "1", key: "k", cluster: "eu", verifiedAt: null },
      }),
    ).toBe(true);
    expect(connectionsReady(null)).toBe(false);
  });
});
