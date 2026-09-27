"use client";

import { useEffect, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CaretLineLeft,
  CaretLineRight,
  Database,
  Plus,
  SignOut,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useSidebarCollapse } from "@/hooks/useSidebarCollapse";
import { cn } from "@/lib/utils";
import { MobileNavDrawer, SkipToContent } from "./MobileNavDrawer";
import { SidebarClock } from "./SidebarClock";

export interface NavItem<T extends string> {
  id: T;
  label: string;
  Icon: PhosphorIcon;
}

/**
 * The shell's current `?tab=`, falling back to `fallback` (and fixing the URL)
 * when it's missing or unknown. Also names the browser tab after it. Changing
 * tabs replaces the URL without a server round-trip (router.replace would
 * wait on the server before the tab changes).
 */
export function useShellTab<T extends string>({
  basePath,
  ids,
  fallback,
  titles,
  area,
}: {
  basePath: string;
  ids: readonly T[];
  fallback: T;
  titles: Record<T, string>;
  /** Shown in the page title: "Orders · Staff · Tably". */
  area: string;
}) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const isTab = (value: string | null): value is T => value !== null && (ids as readonly string[]).includes(value);
  const tab = isTab(tabParam) ? tabParam : fallback;

  const setTab = (next: T) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", next);
    window.history.replaceState(null, "", `${basePath}?${params.toString()}`);
  };

  useEffect(() => {
    document.title = `${titles[tab]} · ${area} · Tably`;
  }, [tab, titles, area]);

  useEffect(() => {
    if (!isTab(tabParam)) setTab(fallback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabParam]);

  return { tab, setTab };
}

/** The header's "+ Add …" button; the label is only visible from `sm`. */
export function HeaderActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button size="sm" onClick={onClick} aria-label={label} className="shrink-0">
      <Plus size={14} weight="bold" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

interface SidebarProps<T extends string> {
  collapsed: boolean;
  section: string;
  logoFallback: PhosphorIcon;
  showDatabase: boolean;
  nav: NavItem<T>[];
  tab: T;
  setTab: (next: T) => void;
  counts: Partial<Record<T, number>>;
  onToggle: () => void;
}

/** Shared by the static rail and the mobile drawer, so the two never drift apart. */
function SidebarBody<T extends string>({
  collapsed,
  section,
  logoFallback: LogoFallback,
  showDatabase,
  nav,
  tab,
  setTab,
  counts,
  onToggle,
}: SidebarProps<T>) {
  const { workspace } = useWorkspace();
  const databaseName = workspace.databaseName ?? null;
  const databaseLabel = databaseName ? `Database: ${databaseName}` : "Using the shared database";
  const rowPadding = collapsed ? "justify-center px-0" : "px-3";

  return (
    <>
      <div className={cn("flex gap-2.5", collapsed ? "items-center justify-center px-0" : "items-start px-2")}>
        <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-500">
          {workspace.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={workspace.logoUrl} alt="" className="size-full object-cover" />
          ) : (
            <LogoFallback size={15} weight="bold" />
          )}
        </span>
        {!collapsed && (
          // Long names wrap onto as many lines as they need instead of being cut off.
          <span className="min-w-0 flex-1 pt-0.5 text-[15px] leading-snug font-bold tracking-tight [overflow-wrap:anywhere]">
            {workspace.name}
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-white/55 transition-colors hover:text-white"
        >
          {collapsed ? <CaretLineRight size={15} weight="bold" /> : <CaretLineLeft size={15} weight="bold" />}
        </button>
      </div>
      {!collapsed && <SidebarClock className="px-2 text-[13px] text-white/55" />}

      <nav className="flex flex-col gap-1">
        {!collapsed && (
          <p className="px-2 pb-1.5 text-[11px] font-semibold tracking-widest text-white/60">{section}</p>
        )}
        {showDatabase && (
          // The business's database, styled like a tab row but not clickable.
          <div
            title={databaseLabel}
            className={cn("flex items-center gap-2.5 rounded-lg py-2.5 text-sm font-bold text-white/65", rowPadding)}
          >
            <Database size={17} weight="bold" className="shrink-0" aria-hidden />
            {collapsed ? (
              <span className="sr-only">{databaseLabel}</span>
            ) : (
              <span className="min-w-0 flex-1 [overflow-wrap:anywhere] text-white">
                {databaseName ?? "Shared database"}
              </span>
            )}
          </div>
        )}
        {nav.map(({ id, label, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              title={collapsed ? label : undefined}
              aria-label={collapsed ? label : undefined}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg py-2.5 text-sm transition-colors",
                rowPadding,
                active ? "bg-white/12 font-semibold text-white" : "font-medium text-white/65 hover:text-white",
              )}
            >
              <Icon size={17} weight="bold" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{label}</span>
                  {counts[id] !== undefined && (
                    <span
                      className={cn(
                        "min-w-5.5 rounded-full px-1.5 text-center text-[11px] font-bold",
                        active ? "bg-brand-700" : "bg-white/12",
                      )}
                    >
                      {counts[id]}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex-1" />
      <form action={signOutAction}>
        <button
          type="submit"
          title={collapsed ? "Sign out" : undefined}
          aria-label={collapsed ? "Sign out" : undefined}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg py-2.5 text-sm font-medium text-white/55 transition-colors hover:text-white",
            rowPadding,
          )}
        >
          <SignOut size={15} weight="bold" />
          {!collapsed && "Sign out"}
        </button>
      </form>
    </>
  );
}

/**
 * The admin and staff apps' frame: collapsible sidebar (a drawer on narrow
 * screens), header with the tab title and `actions`, the panel (`children`)
 * and footer. `overlays` renders after the frame (e.g. dialogs).
 */
export function AppShell<T extends string>({
  section,
  logoFallback,
  showDatabase = false,
  nav,
  tab,
  onTabChange,
  counts,
  title,
  actions,
  overlays,
  children,
}: {
  /** The sidebar's section label ("ADMIN", "STAFF"). */
  section: string;
  /** Shown in place of the business's logo when it has none. */
  logoFallback: PhosphorIcon;
  /** Show the business's database row (owners only). */
  showDatabase?: boolean;
  nav: NavItem<T>[];
  tab: T;
  onTabChange: (next: T) => void;
  counts: Partial<Record<T, number>>;
  title: string;
  actions?: ReactNode;
  overlays?: ReactNode;
  children: ReactNode;
}) {
  const { collapsed, isNarrow, mobileOpen, closeMobile, toggle } = useSidebarCollapse();
  const sidebar = { section, logoFallback, showDatabase, nav, tab, counts };

  return (
    <div className="flex min-h-screen">
      <SkipToContent />
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col gap-7 bg-ink p-3.5 text-white transition-[width] duration-200",
          collapsed ? "w-16" : "w-58",
        )}
      >
        <SidebarBody {...sidebar} collapsed={collapsed} setTab={onTabChange} onToggle={toggle} />
      </aside>

      <MobileNavDrawer open={isNarrow && mobileOpen} onClose={closeMobile}>
        <SidebarBody
          {...sidebar}
          collapsed={false}
          setTab={(next) => {
            onTabChange(next);
            closeMobile();
          }}
          onToggle={closeMobile}
        />
      </MobileNavDrawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card px-4 md:gap-4 md:px-6">
          <Link href="/" aria-label="Tably home" className="flex shrink-0 items-center gap-2">
            <span className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md">
              <Image src="/icons/bell_master.png" alt="" fill sizes="24px" className="object-cover" />
            </span>
            <span className="hidden text-sm font-bold tracking-tight sm:inline">Tably</span>
          </Link>
          <div className="h-5 w-px shrink-0 bg-border" />
          <h1 className="min-w-0 flex-1 truncate text-xl font-bold sm:flex-initial">{title}</h1>
          <div className="hidden flex-1 sm:block" />
          {actions}
        </header>

        <div id="main-content" role="main" tabIndex={-1} className="w-full flex-1 p-4 outline-none md:p-6">
          {children}
        </div>

        <footer className="border-t bg-card px-4 py-4 text-xs text-muted-foreground md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} Tably. All rights reserved.</span>
            <Link href="/instruction" className="hover:text-foreground hover:underline">
              How Tably works
            </Link>
          </div>
        </footer>
      </div>

      {overlays}
    </div>
  );
}
