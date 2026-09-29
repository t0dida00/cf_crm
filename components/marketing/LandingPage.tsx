"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { BellRinging, ChartLineUp, QrCode, Table } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/Button";
import { LEXICON } from "@/lib/lexicon";
import type { Domain } from "@/lib/types";
import { SITE_OWNER } from "@/lib/siteOwner";
import { ContactForm } from "@/components/common/ContactForm";
import { DISPLAY, MarketingFooter, MarketingHeader, MarketingShell } from "./MarketingTheme";
import { TicketRail } from "./TicketRail";
import { ServiceFlow } from "./ServiceFlow";

const NAV_LINKS = [
  { href: "#features", key: "features" },
  { href: "#demo", key: "demo" },
  { href: "#menu", key: "menu" },
  { href: "#contact", key: "contact" },
] as const;

const FEATURES = [
  { icon: QrCode, key: "qr" },
  { icon: BellRinging, key: "live" },
  { icon: Table, key: "tables" },
  { icon: ChartLineUp, key: "numbers" },
] as const;

const STEPS = ["setup", "menu", "live"] as const;

// Solid cobalt primary and a bordered white secondary (light buttons need a border).
const PRIMARY = "h-11 border-0 bg-(--landing-accent) px-5 text-base text-white hover:bg-(--landing-accent-hover)";
const SECONDARY =
  "h-11 border border-(--landing-edge) bg-(--landing-card) px-5 text-base text-(--landing-ink) hover:bg-(--landing-bg-alt)";

export function LandingPage() {
  const { t } = useTranslation();
  return (
    <MarketingShell>
      <MarketingHeader>
        <nav aria-label={t("marketing.nav.label")} className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map(({ href, key }) => (
            <a key={href} href={href} className="rounded-sm text-sm font-medium text-(--landing-muted) hover:text-(--landing-ink)">
              {t(`marketing.nav.${key}`)}
            </a>
          ))}
        </nav>
        <Button asChild className={`${PRIMARY} h-9 px-4 text-sm`}>
          <Link href="/login">{t("marketing.tryDemo")}</Link>
        </Button>
      </MarketingHeader>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-12 pb-10 sm:px-6 lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] lg:gap-8 lg:pt-20 lg:pb-16">
          <div>
            <h1 className={`${DISPLAY} text-[clamp(3.5rem,11vw,7.5rem)] text-balance`}>
              {t("marketing.hero.title")}
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-pretty text-(--landing-muted)">
              {t("marketing.hero.body")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild className={PRIMARY}>
                <Link href="/login">{t("marketing.tryDemo")}</Link>
              </Button>
              <Button asChild className={SECONDARY}>
                <Link href="/signup">{t("marketing.createAccount")}</Link>
              </Button>
            </div>
          </div>
          <TicketRail />
        </section>

        <section id="features" aria-labelledby="features-title" className="bg-(--landing-bg-alt) py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="features-title" className={`${DISPLAY} max-w-3xl text-5xl text-balance sm:text-6xl`}>
              {t("marketing.features.title")}
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-(--landing-muted)">
              {t("marketing.features.intro")}
            </p>

            <div className="mt-10">
              <ServiceFlow />
            </div>

            <ul className="mt-12 grid gap-x-8 gap-y-6 border-t border-(--landing-border) pt-8 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ icon: Icon, key }) => (
                <li key={key}>
                  <Icon size={28} weight="duotone" aria-hidden className="text-(--landing-accent)" />
                  <h3 className="mt-3 text-lg font-bold">{t(`marketing.features.${key}.title`)}</h3>
                  <p className="mt-1 text-pretty text-(--landing-muted)">{t(`marketing.features.${key}.body`)}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <DemoAccess />

        <MenuSample />

        <section aria-labelledby="steps-title" className="bg-(--landing-bg-alt) py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="steps-title" className={`${DISPLAY} max-w-2xl text-5xl text-balance sm:text-6xl`}>
              {t("marketing.steps.title")}
            </h2>
            <ol className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6">
              {STEPS.map((key, i) => (
                <li key={key} className="border-t-4 border-(--landing-accent) pt-4">
                  <span className={`${DISPLAY} text-5xl text-(--landing-accent)`} aria-hidden>
                    {i + 1}
                  </span>
                  <h3 className="mt-2 text-lg font-bold">{t(`marketing.steps.${key}.title`)}</h3>
                  <p className="mt-1 text-pretty text-(--landing-muted)">{t(`marketing.steps.${key}.body`)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section aria-labelledby="signup-title" className="bg-(--landing-ink) py-16 text-white sm:py-20">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 id="signup-title" className={`${DISPLAY} text-5xl text-balance sm:text-6xl`}>
                {t("marketing.signup.title")}
              </h2>
              <p className="mt-4 text-[#c9d2da]">{t("marketing.signup.body")}</p>
            </div>
            <Button asChild className="h-11 shrink-0 border-0 bg-white px-5 text-base text-(--landing-ink) hover:bg-(--landing-bg)">
              <Link href="/signup">{t("marketing.createAccount")}</Link>
            </Button>
          </div>
        </section>

        <section id="contact" aria-labelledby="contact-title" className="py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 id="contact-title" className={`${DISPLAY} text-5xl sm:text-6xl`}>
                {t("marketing.contact.title")}
              </h2>
              <p className="mt-4 max-w-md text-pretty text-(--landing-muted)">
                {t("marketing.contact.body")}
              </p>
              <p className="mt-8 font-bold">{SITE_OWNER.name}</p>
              <a
                href={`mailto:${SITE_OWNER.email}`}
                className="rounded-sm text-(--landing-accent) underline underline-offset-4 hover:text-(--landing-accent-hover)"
              >
                {SITE_OWNER.email}
              </a>
            </div>
            <div className="rounded-md border border-(--landing-border) bg-(--landing-card) p-6 sm:p-8">
              <ContactForm buttonClassName={`${PRIMARY} w-full sm:w-auto`} />
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </MarketingShell>
  );
}

function DemoAccess() {
  const { t } = useTranslation();
  return (
    <section id="demo" aria-labelledby="demo-title" className="border-y border-(--landing-border) bg-(--landing-card)">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-8">
        <div>
          <h2 id="demo-title" className="text-xl font-bold">
            {t("marketing.demo.title")}
          </h2>
          <p className="mt-1 max-w-xl text-pretty text-(--landing-muted)">
            {t("marketing.demo.body")}
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild className={PRIMARY}>
            <Link href="#contact">{t("marketing.demo.contact")}</Link>
          </Button>
          <Link
            href="/instruction"
            className="rounded-sm text-sm font-medium text-(--landing-accent) underline underline-offset-4 hover:text-(--landing-accent-hover)"
          >
            {t("marketing.demo.roles")}
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Sample menus from the lexicon, set as a printed menu sheet, in the visitor's language. */
function MenuSample() {
  const { t } = useTranslation();
  const domains: Domain[] = ["restaurant", "cafe"];
  return (
    <section id="menu" aria-labelledby="menu-title" className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 id="menu-title" className={`${DISPLAY} max-w-2xl text-5xl text-balance sm:text-6xl`}>
          {t("marketing.menu.title")}
        </h2>
        <p className="mt-4 max-w-xl text-pretty text-(--landing-muted)">{t("marketing.menu.body")}</p>

        <div className="mt-10 grid rounded-md border border-(--landing-border) bg-(--landing-card) md:grid-cols-2 md:divide-x md:divide-(--landing-border)">
          {domains.map((domain) => (
            <div key={domain} className="border-b border-(--landing-border) p-6 last:border-b-0 sm:p-8 md:border-b-0">
              <h3 className={`${DISPLAY} text-4xl`}>{t(`lexicon.${domain}.label`)}</h3>
              <p className="mt-1 text-sm text-(--landing-muted)">{t(`lexicon.${domain}.blurb`)}</p>
              {LEXICON[domain].categories.map((category) => (
                <div key={category.id} className="mt-7">
                  <h4 className="text-lg font-bold text-(--landing-accent)">{t(`lexicon.categories.${category.id}`)}</h4>
                  <ul className="mt-3 space-y-3">
                    {category.dishes.map(({ id, price }) => (
                      <li key={id}>
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold">{t(`lexicon.dishes.${id}.name`)}</span>
                          <span aria-hidden className="min-w-4 flex-1 translate-y-[-0.25em] border-b-2 border-dotted border-(--landing-border)" />
                          <span className="font-semibold tabular-nums">€{price.toFixed(2)}</span>
                        </div>
                        <p className="text-sm text-pretty text-(--landing-muted)">{t(`lexicon.dishes.${id}.note`)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
