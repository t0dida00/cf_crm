import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";
import { MarketingFooter, MarketingHeader, MarketingShell } from "./MarketingTheme";
import { DISPLAY } from "./typeScale";

/** The date the legal pages were last changed; update it with their text. */
export const LEGAL_UPDATED = "29 September 2026";

/** Terms, privacy and cookies: one readable column (under 75 characters a line). */
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <MarketingShell>
      <MarketingHeader>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-sm text-sm font-medium text-(--landing-muted) hover:text-(--landing-ink)"
        >
          <ArrowLeft size={15} weight="bold" aria-hidden />
          Back to home
        </Link>
      </MarketingHeader>

      <main className="mx-auto max-w-2xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16">
        <h1 className={`${DISPLAY} text-6xl text-balance sm:text-7xl`}>{title}</h1>
        <p className="mt-3 text-sm text-(--landing-muted)">Last updated {LEGAL_UPDATED}</p>
        <p className="mt-6 text-lg leading-relaxed text-pretty">{intro}</p>
        <div className="mt-10 space-y-10 leading-relaxed [&_a]:rounded-sm [&_a]:text-(--landing-accent) [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-2xl [&_h2]:font-bold [&_li]:mt-2 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {children}
        </div>
      </main>

      <MarketingFooter />
    </MarketingShell>
  );
}
