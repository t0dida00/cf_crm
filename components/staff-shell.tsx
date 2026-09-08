"use client";

import { useEffect, useState } from "react";
import {
  CalendarCheck,
  ClockCounterClockwise,
  ForkKnife,
  Receipt,
  SignOut,
  SquaresFour,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useWorkspace } from "@/components/workspace-provider";
import { StaffMenuPanel } from "@/components/panels/staff/staff-menu-panel";
import { StaffOrdersPanel } from "@/components/panels/staff/staff-orders-panel";
import { StaffBookingsPanel } from "@/components/panels/staff/staff-bookings-panel";
import { StaffTablesPanel } from "@/components/panels/staff/staff-tables-panel";
import { StaffHistoryPanel } from "@/components/panels/staff/staff-history-panel";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions";

type StaffTab = "menu" | "orders" | "bookings" | "tables" | "history";

const NAV: { id: StaffTab; label: string; Icon: PhosphorIcon }[] = [
  { id: "menu", label: "Menu", Icon: ForkKnife },
  { id: "orders", label: "Orders", Icon: Receipt },
  { id: "bookings", label: "Bookings", Icon: CalendarCheck },
  { id: "tables", label: "Tables", Icon: SquaresFour },
  { id: "history", label: "History", Icon: ClockCounterClockwise },
];

const TITLES: Record<StaffTab, string> = {
  menu: "Menu",
  orders: "Orders",
  bookings: "Bookings",
  tables: "Tables",
  history: "History",
};

export function StaffShell() {
  const { workspace } = useWorkspace();
  const [tab, setTab] = useState<StaffTab>("menu");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);

  const initials = (workspace.name || "W")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const openOrders = workspace.orders.filter((o) => !o.closedTs);
  const closedOrders = workspace.orders.filter((o) => o.closedTs);
  const counts: Record<StaffTab, number> = {
    menu: workspace.dishes.length,
    orders: openOrders.length,
    bookings: workspace.bookings.filter((b) => b.ts >= startOfToday).length,
    tables: workspace.tables.filter((t) => t.state === "Free").length,
    history: closedOrders.length,
  };

  const clock =
    new Date(now).toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }) +
    " · " +
    new Date(now).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-58 shrink-0 flex-col gap-7 bg-ink p-3.5 text-white">
        <div className="flex items-center gap-2.5 px-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500">
            <ForkKnife size={15} weight="bold" />
          </span>
          <span className="text-[15px] font-bold tracking-tight">{workspace.name}</span>
        </div>

        <nav className="flex flex-col gap-1">
          <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-widest text-white/40">
            STAFF
          </p>
          {NAV.map(({ id, label, Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-white/12 font-semibold text-white"
                    : "font-medium text-white/65 hover:text-white",
                )}
              >
                <Icon size={17} weight="bold" />
                <span className="flex-1 text-left">{label}</span>
                <span
                  className={cn(
                    "min-w-5.5 rounded-full px-1.5 text-center text-[11px] font-bold",
                    active ? "bg-brand-500" : "bg-white/12",
                  )}
                >
                  {counts[id]}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex-1" />
        <div className="px-3 py-2.5 text-[13px] text-white/55">{clock}</div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white/55 transition-colors hover:text-white"
          >
            <SignOut size={15} weight="bold" />
            Sign out
          </button>
        </form>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b bg-card px-6">
          <h1 className="text-xl font-bold">{TITLES[tab]}</h1>
          <div className="flex-1" />
          <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-white">
            {initials}
          </span>
        </header>

        <div className="w-full p-6">
          {tab === "menu" && <StaffMenuPanel />}
          {tab === "orders" && <StaffOrdersPanel />}
          {tab === "bookings" && <StaffBookingsPanel />}
          {tab === "tables" && <StaffTablesPanel />}
          {tab === "history" && <StaffHistoryPanel />}
        </div>
      </div>
    </div>
  );
}
