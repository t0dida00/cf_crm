import Link from "next/link";
import Image from "next/image";
import { Archivo } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import { DISPLAY } from "./typeScale";

/* One family on its width axis: condensed and heavy for headlines (a kitchen
 * board), normal width for reading. */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
});

export { DISPLAY } from "./typeScale";

/* The kitchen pass: steel counter, white tickets, cobalt ink (azulejo, and the
 * app's own blue family), saffron for the order that just came in.
 * Text pairs: ink 13.2:1 and slate 5.6:1 on steel; white on cobalt 8.3:1;
 * ink on saffron 8.7:1. Saffron is a fill, never text on a light ground.
 * --landing-edge (3.4:1 on steel) is for borders that must be seen. */
export const LANDING_THEME_VARS: CSSProperties = {
  ["--landing-bg" as string]: "#e3e7ea",
  ["--landing-bg-alt" as string]: "#f3f5f6",
  ["--landing-ink" as string]: "#15202d",
  ["--landing-muted" as string]: "#4e5b67",
  ["--landing-accent" as string]: "#1d4aa0",
  ["--landing-accent-hover" as string]: "#173c84",
  ["--landing-saffron" as string]: "#f0b232",
  ["--landing-border" as string]: "#c3cbd2",
  ["--landing-edge" as string]: "#6f7c88",
  ["--landing-card" as string]: "#ffffff",
  /* Shared ui/ components (Button, radios, focus rings) take cobalt here. */
  ["--primary" as string]: "#1d4aa0",
  ["--brand-800" as string]: "#173c84",
  ["--ring" as string]: "#1d4aa0",
  backgroundColor: "var(--landing-bg)",
  color: "var(--landing-ink)",
};

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className={`${archivo.variable} ${archivo.className} min-h-screen`} style={LANDING_THEME_VARS}>
      {children}
    </div>
  );
}

/** Logo on the left; `children` fills the right side (nav, actions). */
export function MarketingHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b border-(--landing-border)">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 rounded-md">
          <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
            <Image src="/icons/bell_master.png" alt="" fill sizes="32px" className="object-cover" />
          </span>
          <span className={`${DISPLAY} text-2xl`}>Tably</span>
        </Link>
        {children}
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-(--landing-border) py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-(--landing-muted) sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>Tably, ordering for restaurants and cafés</span>
        <span>© {new Date().getFullYear()} Tably. All rights reserved.</span>
      </div>
    </footer>
  );
}
