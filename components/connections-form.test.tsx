import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Connections } from "@/hooks/use-connections";

const mutate = vi.fn();
const checkMutate = vi.fn();
let state: { connections: Connections | null; saveError: Error | null; checkError?: Error | null } = {
  connections: null,
  saveError: null,
};

vi.mock("@/hooks/use-connections", () => ({
  useConnections: () => ({
    connections: state.connections,
    status: state.connections ? "success" : "loading",
    error: null,
    retry: vi.fn(),
    saveConnections: { mutate, isPending: false, error: state.saveError },
    checkConnections: { mutate: checkMutate, isPending: false, error: state.checkError },
  }),
}));

import { ConnectionsForm, connectionsReady } from "./connections-form";

const base: Connections = { database: null, pusher: null, storage: null, sharedInfraAllowed: true, canStoreCredentials: true };
const connected: Connections = {
  ...base,
  database: { label: "db.example.com/shop", verifiedAt: "2026-09-27T10:00:00Z" },
  pusher: { appId: "42", key: "abc", cluster: "eu", verifiedAt: null },
  storage: { provider: "s3", label: "menu-photos · pub-1.r2.dev", verifiedAt: null },
};

afterEach(cleanup);
beforeEach(() => {
  mutate.mockReset();
  checkMutate.mockReset();
  state = { connections: base, saveError: null };
});

const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(new RegExp(`^${label}`)), { target: { value } });

describe("ConnectionsForm", () => {
  test("has a single Test & save that requires the database, Pusher and storage fields", () => {
    render(<ConnectionsForm />);
    expect(screen.getAllByRole("button", { name: "Test & save" })).toHaveLength(1);
    for (const label of [
      "Database connection URL",
      "Pusher app ID",
      "Pusher cluster",
      "Pusher key",
      "Pusher secret",
      "Vercel Blob read-write token",
    ]) {
      expect((screen.getByLabelText(new RegExp(`^${label}`)) as HTMLInputElement).required).toBe(true);
    }
  });

  test("saves all three together, then clears the form and reports success", () => {
    const onSaved = vi.fn();
    mutate.mockImplementation((_input, opts) => opts.onSuccess());
    render(<ConnectionsForm onSaved={onSaved} />);

    fill("Database connection URL", "  postgresql://u:p@db.example.com/shop  ");
    fill("Pusher app ID", "42");
    fill("Pusher cluster", "eu");
    fill("Pusher key", "abcdef123456");
    fill("Pusher secret", "fedcba654321");
    fill("Vercel Blob read-write token", " vercel_blob_rw_store_secret ");
    fireEvent.click(screen.getByRole("button", { name: "Test & save" }));

    expect(mutate).toHaveBeenCalledWith(
      {
        databaseUrl: "postgresql://u:p@db.example.com/shop",
        pusher: { appId: "42", key: "abcdef123456", secret: "fedcba654321", cluster: "eu" },
        storage: { provider: "vercel_blob", token: "vercel_blob_rw_store_secret" },
      },
      expect.anything(),
    );
    expect(onSaved).toHaveBeenCalled();
  });

  test("switching to S3-compatible asks for the bucket details (region optional) and sends only those", () => {
    render(<ConnectionsForm />);
    fill("Vercel Blob read-write token", "vercel_blob_rw_store_secret");
    fireEvent.click(screen.getByRole("radio", { name: "S3-compatible" }));

    expect(screen.getByRole("radio", { name: "S3-compatible" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.queryByLabelText(/^Vercel Blob read-write token/)).toBeNull();
    for (const label of ["Endpoint", "Bucket", "Public URL", "Access key ID", "Secret access key"]) {
      expect((screen.getByLabelText(new RegExp(`^${label}`)) as HTMLInputElement).required).toBe(true);
    }
    expect((screen.getByLabelText(/^Region/) as HTMLInputElement).required).toBe(false);

    fill("Endpoint", "https://acc.r2.cloudflarestorage.com");
    fill("Bucket", "menu-photos");
    fill("Public URL", "https://pub-1.r2.dev");
    fill("Access key ID", "AKIAEXAMPLE123");
    fill("Secret access key", "sup3r-s3cret-key");
    fireEvent.submit(screen.getByRole("button", { name: "Test & save" }).closest("form")!);

    expect(mutate.mock.calls[0][0].storage).toEqual({
      provider: "s3",
      endpoint: "https://acc.r2.cloudflarestorage.com",
      region: "",
      bucket: "menu-photos",
      accessKeyId: "AKIAEXAMPLE123",
      secretAccessKey: "sup3r-s3cret-key",
      publicUrl: "https://pub-1.r2.dev",
    });
  });

  test("pasting Pusher's App Keys snippet fills the four fields and clears the paste box", () => {
    render(<ConnectionsForm />);
    const box = screen.getByLabelText("Paste from Pusher") as HTMLTextAreaElement;
    fireEvent.change(box, {
      target: { value: `app_id = "2192925"\nkey = "eb03391fdac437415721"\nsecret = "0123456789abcdef"\ncluster = "ap1"` },
    });

    expect((screen.getByLabelText(/^Pusher app ID/) as HTMLInputElement).value).toBe("2192925");
    expect((screen.getByLabelText(/^Pusher key/) as HTMLInputElement).value).toBe("eb03391fdac437415721");
    expect((screen.getByLabelText(/^Pusher secret/) as HTMLInputElement).value).toBe("0123456789abcdef");
    expect((screen.getByLabelText(/^Pusher cluster/) as HTMLInputElement).value).toBe("ap1");
    expect(box.value).toBe("");
    expect(screen.getByText("Filled the Pusher app ID, key, secret and cluster.")).toBeTruthy();
  });

  test("says what's missing after a partial or unrecognised paste", () => {
    render(<ConnectionsForm />);
    const box = screen.getByLabelText("Paste from Pusher");
    fireEvent.change(box, { target: { value: `key = "eb03391fdac437415721"` } });
    expect(screen.getByText("Filled the Pusher key. Fill in the rest below.")).toBeTruthy();
    fireEvent.change(box, { target: { value: "hello" } });
    expect(screen.getByText(/Couldn't find Pusher credentials/)).toBeTruthy();
  });

  test("every field is readable text, with writing assistants turned off", () => {
    render(<ConnectionsForm />);
    for (const label of ["Database connection URL", "Pusher app ID", "Pusher cluster", "Pusher key", "Pusher secret", "Vercel Blob read-write token"]) {
      const input = screen.getByLabelText(new RegExp(`^${label}`)) as HTMLInputElement;
      expect(input.type).toBe("text");
      expect(input.getAttribute("data-gramm")).toBe("false");
    }
    expect(screen.getByLabelText("Paste from Pusher").getAttribute("data-gramm")).toBe("false");
  });

  test("shows the backend's reason when saving fails", () => {
    state.saveError = new Error("Pusher rejected these credentials: 401");
    render(<ConnectionsForm />);
    expect(screen.getByRole("alert").textContent).toMatch(/Pusher rejected/);
  });

  test("when all three are connected, shows labels only and one Replace connections button", () => {
    state.connections = connected;
    render(<ConnectionsForm />);
    expect(screen.getByText(/db\.example\.com\/shop/)).toBeTruthy();
    expect(screen.getByText(/App 42 · eu/)).toBeTruthy();
    expect(screen.getByText(/menu-photos · pub-1\.r2\.dev/)).toBeTruthy();
    expect(screen.queryByLabelText(/^Database connection URL/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Replace connections" }));
    expect(screen.getByLabelText(/^Database connection URL/)).toBeTruthy();
    expect(screen.getByLabelText(/^Pusher secret/)).toBeTruthy();
  });

  test("asks for everything again when storage isn't connected yet (database and Pusher are)", () => {
    state.connections = { ...connected, storage: null };
    render(<ConnectionsForm />);
    expect(screen.getByLabelText(/^Database connection URL/)).toBeTruthy();
    expect(screen.getByLabelText(/^Vercel Blob read-write token/)).toBeTruthy();
  });

  test("before the business exists, Test & continue only checks, then hands the input over", () => {
    const onChecked = vi.fn();
    checkMutate.mockImplementation((_input, opts) => opts.onSuccess());
    render(<ConnectionsForm onChecked={onChecked} />);

    fill("Database connection URL", "postgresql://u:p@db.example.com/shop");
    fill("Pusher app ID", "42");
    fill("Pusher cluster", "eu");
    fill("Pusher key", "abcdef123456");
    fill("Pusher secret", "fedcba654321");
    fill("Vercel Blob read-write token", "vercel_blob_rw_store_secret");
    fireEvent.click(screen.getByRole("button", { name: "Test & continue" }));

    const input = checkMutate.mock.calls[0][0];
    expect(input.storage).toEqual({ provider: "vercel_blob", token: "vercel_blob_rw_store_secret" });
    expect(onChecked).toHaveBeenCalledWith(input);
    expect(mutate).not.toHaveBeenCalled();
  });

  test("shows why a check failed", () => {
    state.checkError = new Error("This database already has tables. Use an empty database.");
    render(<ConnectionsForm onChecked={vi.fn()} />);
    expect(screen.getByRole("alert").textContent).toMatch(/already has tables/);
  });

  test("fills in the form from what was checked before", () => {
    render(
      <ConnectionsForm
        onChecked={vi.fn()}
        initial={{
          databaseUrl: "postgresql://u:p@db.example.com/shop",
          pusher: { appId: "42", key: "abcdef123456", secret: "fedcba654321", cluster: "eu" },
          storage: {
            provider: "s3",
            endpoint: "https://acc.r2.cloudflarestorage.com",
            region: "",
            bucket: "menu-photos",
            accessKeyId: "AKIAEXAMPLE123",
            secretAccessKey: "sup3r-s3cret-key",
            publicUrl: "https://pub-1.r2.dev",
          },
        }}
      />,
    );
    expect((screen.getByLabelText(/^Database connection URL/) as HTMLInputElement).value).toBe("postgresql://u:p@db.example.com/shop");
    expect((screen.getByLabelText(/^Pusher secret/) as HTMLInputElement).value).toBe("fedcba654321");
    expect(screen.getByRole("radio", { name: "S3-compatible" }).getAttribute("aria-checked")).toBe("true");
    expect((screen.getByLabelText(/^Bucket/) as HTMLInputElement).value).toBe("menu-photos");
  });

  test("blocks saving when the server can't store credentials", () => {
    state.connections = { ...base, canStoreCredentials: false };
    render(<ConnectionsForm />);
    expect(screen.getByRole("alert").textContent).toMatch(/CREDENTIALS_KEY/);
    expect((screen.getByRole("button", { name: "Test & save" }) as HTMLButtonElement).disabled).toBe(true);
  });
});

describe("connectionsReady", () => {
  test("allows continuing on the shared service when it's allowed", () => {
    expect(connectionsReady(base)).toBe(true);
  });

  test("otherwise needs a database, Pusher and storage", () => {
    const own = { ...base, sharedInfraAllowed: false };
    expect(connectionsReady(own)).toBe(false);
    expect(connectionsReady({ ...own, database: connected.database })).toBe(false);
    expect(connectionsReady({ ...own, database: connected.database, pusher: connected.pusher })).toBe(false);
    expect(connectionsReady({ ...connected, sharedInfraAllowed: false })).toBe(true);
    expect(connectionsReady(null)).toBe(false);
  });
});
