import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, test, vi } from "vitest";
import { axeViolations } from "@/test/axe";

vi.mock("@/components/providers/WorkspaceProvider", () => ({
  useWorkspace: () => ({
    hydrated: true,
    workspace: {
      tables: [
        { id: "a", name: "Table 4", seats: 4, zone: "Terrace", state: "Free", seatedAt: null },
        { id: "b", name: "Table 4", seats: 10, zone: "—", state: "Free", seatedAt: null },
      ],
    },
  }),
}));
vi.mock("@/lib/http", () => ({ fetchJson: async () => ({ origin: "http://192.168.1.7:3001" }) }));
vi.mock("@/lib/api", () => ({
  apiFetch: async () => ({
    tokens: [
      { tableId: "a", tableName: "Table 4", token: "tok-a" },
      { tableId: "b", tableName: "Table 4", token: "tok-b" },
    ],
  }),
}));

const downloadFile = vi.hoisted(() => vi.fn());
vi.mock("@/lib/downloadFile", () => ({ downloadFile }));

import { QrPanel } from "./QrPanel";

afterEach(cleanup);

const renderPanel = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <QrPanel />
    </QueryClientProvider>,
  );

describe("QrPanel", () => {
  test("gives two tables with the same name their own code", async () => {
    const { container } = renderPanel();
    await waitFor(() => expect(container.querySelector("#qr-a")).toBeTruthy());
    expect(container.querySelector("#qr-b")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Download the QR code for Table 4" })).toHaveLength(2);
  });

  test("shows a table's zone, but not the dash placeholder", async () => {
    renderPanel();
    expect(await screen.findByText("4 seats, Terrace")).toBeTruthy();
    expect(screen.getByText("10 seats")).toBeTruthy();
  });

  test("the table card downloads as an SVG that declares UTF-8", async () => {
    renderPanel();
    const [card] = await screen.findAllByRole("button", { name: "Download the table card for Table 4" });
    card.click();
    const [xml, fileName, type] = downloadFile.mock.calls[0];
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(fileName).toBe("table-4-card.svg");
    expect(type).toBe("image/svg+xml;charset=utf-8");
  });

  test("has no axe violations", async () => {
    const { container } = renderPanel();
    await waitFor(() => expect(container.querySelector("#qr-a")).toBeTruthy());
    expect(await axeViolations(container)).toEqual([]);
  });
});
