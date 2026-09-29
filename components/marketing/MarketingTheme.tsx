"use client";

import Link from "next/link";
import Image from "next/image";
import { Nunito_Sans } from "next/font/google";
import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { SITE_OWNER } from "@/lib/siteOwner";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { DISPLAY } from "./typeScale";

/* One family on its width axis: condensed and heavy for headlines (a kitchen
 * board), normal width for reading. The variable build, since the app's own
 * Nunito Sans (app/layout.tsx) is static 400–700 without the width axis. */
const nunitoSans = Nunito_Sans({
  subsets: ["latin", "vietnamese"],
  axes: ["wdth"],
  variable: "--font-nunito-marketing",
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
    <div className={`${nunitoSans.variable} ${nunitoSans.className} min-h-screen`} style={LANDING_THEME_VARS}>
      {children}
    </div>
  );
}

/** Logo on the left; `children` fills the right side (nav, actions), then the language switcher. */
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
        <div className="flex items-center gap-4">
          {children}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

/* `/#…` so the section links work from every public page. Labels are
 * translation keys under marketing.footer, except the email address. */
export const FOOTER_COLUMNS = [
  {
    title: "product",
    links: [
      { label: "marketing.nav.features", href: "/#features" },
      { label: "marketing.footer.sampleMenu", href: "/#menu" },
      { label: "marketing.footer.roles", href: "/instruction" },
      { label: "marketing.tryDemo", href: "/login" },
      { label: "marketing.createAccount", href: "/signup" },
    ],
  },
  {
    title: "contact",
    links: [
      { label: "marketing.footer.sendMessage", href: "/#contact" },
      { label: null, text: SITE_OWNER.email, href: `mailto:${SITE_OWNER.email}` },
    ],
  },
  {
    title: "legal",
    links: [
      { label: "marketing.footer.terms", href: "/terms" },
      { label: "marketing.footer.privacy", href: "/privacy" },
      { label: "marketing.footer.cookies", href: "/cookies" },
    ],
  },
] as const;

/** Closes every public page. Text on ink: white 16.5:1, #c9d2da 10.7:1. */
export function MarketingFooter() {
  const { t } = useTranslation();
  return (
    <footer className="bg-(--landing-ink) text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-14 pb-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-md">
            <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md">
              <Image src="/icons/bell_master.png" alt="" fill sizes="32px" className="object-cover" />
            </span>
            <span className={`${DISPLAY} text-3xl`}>Tably</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-pretty text-[#c9d2da]">
            {t("marketing.footer.tagline")}
          </p>
        </div>
        {FOOTER_COLUMNS.map(({ title, links }) => (
          <nav key={title} aria-label={t(`marketing.footer.${title}`)}>
            <h2 className="font-bold">{t(`marketing.footer.${title}`)}</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-sm [overflow-wrap:anywhere] text-[#c9d2da] underline-offset-4 hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  >
                    {"text" in link ? link.text : t(link.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-[#c9d2da] sm:flex-row sm:justify-between sm:px-6">
          <span>{t("marketing.footer.rights", { year: new Date().getFullYear() })}</span>
          <span>{t("marketing.footer.builtBy", { name: SITE_OWNER.name })}</span>
        </div>
      </div>
    </footer>
  );
}
