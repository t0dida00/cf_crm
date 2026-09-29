"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CalendarCheck,
  ChartBar,
  Folders,
  ForkKnife,
  Gear,
  QrCode,
  Receipt,
  SquaresFour,
  Users,
} from "@phosphor-icons/react";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { DashboardPanel } from "@/components/admin/DashboardPanel";
import { TablesPanel } from "@/components/admin/TablesPanel";
import { CategoriesPanel } from "@/components/admin/CategoriesPanel";
import { MenuPanel } from "@/components/admin/MenuPanel";
import { OrdersPanel } from "@/components/admin/OrdersPanel";
import { BookingsPanel } from "@/components/bookings/BookingsPanel";
import { StaffPanel } from "@/components/admin/StaffPanel";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { ConnectionsPanel } from "@/components/admin/ConnectionsPanel";
import { QrPanel } from "@/components/admin/QrPanel";
import type { TabId } from "@/lib/types";
import { useNewOrderNotifications } from "@/hooks/useNewOrderNotifications";
import { AppShell, HeaderActionButton, useShellTab, type NavItem } from "./AppShell";

/* Tab names, subtitles and header actions are under shell.* in the translations. */
const NAV: Omit<NavItem<TabId>, "label">[] = [
  { id: "dash", Icon: ChartBar },
  { id: "tables", Icon: SquaresFour },
  { id: "categories", Icon: Folders },
  { id: "menu", Icon: ForkKnife },
  { id: "orders", Icon: Receipt },
  { id: "bookings", Icon: CalendarCheck },
  { id: "staff", Icon: Users },
  { id: "qr", Icon: QrCode },
  { id: "settings", Icon: Gear },
];

/** The tabs with a header action ("Add table"…). */
const ACTION_TABS = ["tables", "categories", "menu", "bookings", "staff"] as const;
const hasAction = (tab: TabId): tab is (typeof ACTION_TABS)[number] => (ACTION_TABS as readonly string[]).includes(tab);

const TAB_IDS: TabId[] = NAV.map((n) => n.id);

/** The owner's admin app: the shared AppShell with the admin tabs. */
export function AdminShell() {
  const { workspace, fmt } = useWorkspace();
  const { t } = useTranslation();
  const titles = useMemo(
    () => Object.fromEntries(TAB_IDS.map((id) => [id, t(`shell.tabs.${id}`)])) as Record<TabId, string>,
    [t],
  );
  const nav = useMemo(() => NAV.map((n) => ({ ...n, label: titles[n.id] })), [titles]);
  const { tab, setTab } = useShellTab({ basePath: "/admin", ids: TAB_IDS, fallback: "dash", titles, area: t("shell.area.admin") });
  const [createSignal, setCreateSignal] = useState(0);

  useNewOrderNotifications(true, workspace.id, undefined, fmt, workspace.orders, undefined, workspace.pusher);

  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const counts: Partial<Record<TabId, number>> = {
    tables: workspace.tables.length,
    categories: workspace.categories.length,
    menu: workspace.dishes.length,
    bookings: workspace.bookings.filter((b) => b.ts >= startOfToday).length,
  };
  const actionLabel = hasAction(tab) ? t(`shell.actions.${tab}`) : undefined;

  return (
    <AppShell
      section={t("shell.area.admin").toUpperCase()}
      logoFallback={SquaresFour}
      showDatabase
      nav={nav}
      tab={tab}
      onTabChange={(next) => {
        setCreateSignal(0);
        setTab(next);
      }}
      counts={counts}
      title={titles[tab]}
      actions={actionLabel && <HeaderActionButton label={actionLabel} onClick={() => setCreateSignal((n) => n + 1)} />}
    >
      <p className="mb-5 text-sm text-muted-foreground">{t(`shell.subtitles.${tab}`)}</p>
      {tab === "dash" && <DashboardPanel />}
      {tab === "tables" && <TablesPanel createSignal={createSignal} />}
      {tab === "categories" && <CategoriesPanel createSignal={createSignal} />}
      {tab === "menu" && <MenuPanel createSignal={createSignal} />}
      {tab === "orders" && <OrdersPanel createSignal={createSignal} />}
      {tab === "bookings" && <BookingsPanel createSignal={createSignal} />}
      {tab === "staff" && <StaffPanel createSignal={createSignal} />}
      {tab === "settings" && (
        // Side by side on desktop, stacked below xl.
        <div className="grid items-start gap-4 xl:grid-cols-2">
          <SettingsPanel />
          <ConnectionsPanel />
        </div>
      )}
      {tab === "qr" && <QrPanel />}
    </AppShell>
  );
}
