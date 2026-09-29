import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { dayKey } from "@/lib/bookingSlots";
import { t } from "@/lib/i18n";
import { BookingsPanel, partyLine } from "./BookingsPanel";

const assignBooking = vi.fn(async () => {});
const status = vi.hoisted(() => ({ current: "Confirmed" }));

vi.mock("@/components/providers/WorkspaceProvider", () => ({
  useWorkspace: () => ({
    workspace: {
      bookings: [
        { id: "b1", name: "Ana", time: "20:00", party: 4, tableName: null, get status() { return status.current; }, date: dayKey(new Date()), ts: 0 },
      ],
      tables: [
        { id: "t1", name: "T1", seats: 4, zone: "Patio", state: "Free", seatedAt: null },
        { id: "t2", name: "T2", seats: 2, zone: "Bar", state: "Seated", seatedAt: 1 },
      ],
    },
    saveBooking: vi.fn(),
    toggleBooking: vi.fn(),
    deleteBooking: vi.fn(),
    assignBooking,
    unassignBooking: vi.fn(),
  }),
}));

afterEach(cleanup);

describe("BookingsPanel", () => {
  test("shows today's bookings with the admin actions", () => {
    render(<BookingsPanel createSignal={0} />);
    expect(screen.getByText("Ana")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mark arrived" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Assign table" })).toBeNull();
  });

  test("lets staff assign a free table", async () => {
    render(<BookingsPanel createSignal={0} allowTableAssign />);
    fireEvent.click(screen.getByRole("button", { name: "Assign table" }));

    // Only free tables are offered.
    expect(screen.queryByText("T2")).toBeNull();
    fireEvent.click(await screen.findByText("T1"));
    expect(assignBooking).toHaveBeenCalledWith("b1", "t1");
  });
});

describe("arrived bookings", () => {
  test("an arrived party's row takes the Arrived green", () => {
    status.current = "Arrived";
    render(<BookingsPanel createSignal={0} />);
    const row = screen.getByText("Ana").closest("div.border-t") as HTMLElement;
    expect(row.className).toContain("bg-green-50");
    status.current = "Confirmed";
  });

  test("other bookings keep the plain row", () => {
    render(<BookingsPanel createSignal={0} />);
    const row = screen.getByText("Ana").closest("div.border-t") as HTMLElement;
    expect(row.className).not.toContain("bg-green-50");
  });
});

describe("partyLine", () => {
  test("says where the party sits, or that it has no table yet", () => {
    expect(partyLine(t, { party: 4, tableName: "T2" })).toBe("4 guests at T2");
    expect(partyLine(t, { party: 1, tableName: null })).toBe("1 guest, no table yet");
  });
});
