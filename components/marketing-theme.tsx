import type { CSSProperties, ReactNode } from "react";

export const LANDING_THEME_VARS: CSSProperties = {
  ["--landing-bg" as string]: "#f3ede2",
  ["--landing-bg-alt" as string]: "#ece4d6",
  ["--landing-ink" as string]: "#241c14",
  ["--landing-muted" as string]: "#6f6459",
  ["--landing-accent" as string]: "#b8441f",
  ["--landing-accent-hover" as string]: "#9c3919",
  ["--landing-border" as string]: "#ddd3c1",
  ["--landing-card" as string]: "#faf6ee",
  backgroundColor: "var(--landing-bg)",
  color: "var(--landing-ink)",
};

export function MarketingShell({
  fontVariable,
  children,
}: {
  fontVariable: string;
  children: ReactNode;
}) {
  return (
    <div className={`${fontVariable} min-h-screen`} style={LANDING_THEME_VARS}>
      {children}
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t py-8" style={{ borderColor: "var(--landing-border)" }}>
      <div
        className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 text-xs sm:flex-row"
        style={{ color: "var(--landing-muted)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex size-5 items-center justify-center rounded-md text-[10px] font-bold text-white"
            style={{ backgroundColor: "var(--landing-ink)" }}
          >
            T
          </span>
          <span>Tably · hospitality-grade ordering</span>
        </div>
        <span>© {new Date().getFullYear()} Tably. All rights reserved.</span>
      </div>
    </footer>
  );
}
