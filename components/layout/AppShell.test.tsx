import { cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { CalendarCheck, ForkKnife, Receipt } from "@phosphor-icons/react";
import { axeViolations } from "@/test/axe";

let search = new URLSearchParams("tab=orders");
vi.mock("next/navigation", () => ({ useSearchParams: () => search }));
vi.mock("next/image", () => ({ default: () => null }));
vi.mock("@/app/actions", () => ({ signOutAction: vi.fn() }));
vi.mock("@/hooks/useSidebarCollapse", () => ({
  useSidebarCollapse: () => ({ collapsed: false, isNarrow: false, mobileOpen: false, closeMobile: vi.fn(), toggle: vi.fn() }),
}));
vi.mock("@/components/providers/WorkspaceProvider", () => ({
  useWorkspace: () => ({ workspace: { name: "Khoa Restaurant", logoUrl: null, databaseName: "crm_shop" } }),
}));

import { AppShell, HeaderActionButton, useShellTab, type NavItem } from "./AppShell";

type Tab = "orders" | "bookings";
const NAV: NavItem<Tab>[] = [
  { id: "orders", label: "Orders", Icon: Receipt },
  { id: "bookings", label: "Bookings", Icon: CalendarCheck },
];
const TITLES: Record<Tab, string> = { orders: "Orders", bookings: "Bookings" };

afterEach(cleanup);
beforeEach(() => {
  search = new URLSearchParams("tab=orders");
  window.history.replaceState(null, "", "/staff?tab=orders");
});

const renderShell = (props: Partial<Parameters<typeof AppShell<Tab>>[0]> = {}) =>
  render(
    <AppShell<Tab>
      section="STAFF"
      logoFallback={ForkKnife}
      nav={NAV}
      tab="orders"
      onTabChange={vi.fn()}
      counts={{ orders: 3 }}
      title="Orders"
      {...props}
    >
      <p>panel content</p>
    </AppShell>,
  );

describe("AppShell", () => {
  test("shows the business, the section, the tabs with the current one marked, and the panel", () => {
    renderShell();
    expect(screen.getByText("Khoa Restaurant")).toBeTruthy();
    expect(screen.getByText("STAFF")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Orders" })).toBeTruthy();
    const orders = screen.getByRole("button", { name: /^Orders/ });
    expect(orders.getAttribute("aria-current")).toBe("page");
    expect(orders.textContent).toContain("3");
    expect(screen.getByText("panel content")).toBeTruthy();
  });

  test("shows the database row only when asked (owners)", () => {
    renderShell();
    expect(screen.queryByText("crm_shop")).toBeNull();
    cleanup();
    renderShell({ showDatabase: true });
    expect(screen.getByText("crm_shop")).toBeTruthy();
  });

  test("changes tabs, and renders the header actions and overlays", () => {
    const onTabChange = vi.fn();
    const onAdd = vi.fn();
    renderShell({
      onTabChange,
      actions: <HeaderActionButton label="New booking" onClick={onAdd} />,
      overlays: <div role="dialog">requests</div>,
    });
    fireEvent.click(screen.getByRole("button", { name: /^Bookings/ }));
    expect(onTabChange).toHaveBeenCalledWith("bookings");
    fireEvent.click(screen.getByRole("button", { name: "New booking" }));
    expect(onAdd).toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  test("has no axe violations", async () => {
    const { container } = renderShell({ showDatabase: true });
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("useShellTab", () => {
  const opts = { basePath: "/staff", ids: ["orders", "bookings"] as const, fallback: "orders" as Tab, titles: TITLES, area: "Staff" };

  test("reads the tab and names the browser tab after it", () => {
    search = new URLSearchParams("tab=bookings");
    const { result } = renderHook(() => useShellTab<Tab>({ ...opts, ids: [...opts.ids] }));
    expect(result.current.tab).toBe("bookings");
    expect(document.title).toBe("Bookings · Staff · Tably");
  });

  test("falls back to the default tab and fixes the URL for an unknown one", () => {
    search = new URLSearchParams("tab=nope");
    const { result } = renderHook(() => useShellTab<Tab>({ ...opts, ids: [...opts.ids] }));
    expect(result.current.tab).toBe("orders");
    expect(window.location.search).toBe("?tab=orders");
  });

  test("setTab updates the URL without a navigation", () => {
    const { result } = renderHook(() => useShellTab<Tab>({ ...opts, ids: [...opts.ids] }));
    result.current.setTab("bookings");
    expect(window.location.pathname + window.location.search).toBe("/staff?tab=bookings");
  });
});
