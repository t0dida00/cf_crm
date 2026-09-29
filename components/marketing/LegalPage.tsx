"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/ssr";
import { Trans, useTranslation } from "react-i18next";
import { SITE_OWNER } from "@/lib/siteOwner";
import type { Messages } from "@/lib/i18n/messages";
import { MarketingFooter, MarketingHeader, MarketingShell } from "./MarketingTheme";
import { DISPLAY } from "./typeScale";

export type LegalDoc = "terms" | "privacy" | "cookies";
/** A cookie or storage row's purpose: a key under legal.cookies.rows. */
type StorageRow = keyof Messages["legal"]["cookies"]["rows"];

interface Section {
  h: string;
  p?: string;
  items?: Record<string, string>;
  after?: string;
}

/* Keep in step with the code: Auth.js cookies (auth.ts), the language cookie
 * (lib/i18n/config.ts), and the storage keys in LoginCard, useSidebarCollapse,
 * printReceipt and the admin/staff pages. Purposes are under legal.cookies.rows. */
const COOKIES = [
  ["authjs.session-token", "session"],
  ["authjs.csrf-token", "csrf"],
  ["authjs.callback-url", "callback"],
  ["lang", "lang"],
] as const;
const BROWSER_STORAGE = [
  ["tably:sign-in-as", "signInAs"],
  ["crm-sidebar-collapsed", "sidebar"],
  ["tably:receipt-paper", "paper"],
  ["tably:building-seen", "building"],
] as const;

/**
 * Terms, privacy and cookies, from the translation files: one readable column
 * (under 75 characters a line). Links and emphasis inside sentences are tags
 * in the text (<privacy>, <cookies>, <email>, <b>, <code>), placed by <Trans>
 * so each language keeps its own word order.
 */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  const { t } = useTranslation();
  const values = { name: SITE_OWNER.name, email: SITE_OWNER.email };
  const components = {
    privacy: <Link href="/privacy" />,
    cookies: <Link href="/cookies" />,
    email: <a href={`mailto:${SITE_OWNER.email}`} />,
    b: <strong />,
    code: <code />,
  };
  const rich = (key: string) => <Trans i18nKey={key as never} values={values} components={components} />;
  const sections = t(`legal.${doc}.sections`, { returnObjects: true }) as Record<string, Section>;

  return (
    <MarketingShell>
      <MarketingHeader>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-sm text-sm font-medium text-(--landing-muted) hover:text-(--landing-ink)"
        >
          <ArrowLeft size={15} weight="bold" aria-hidden />
          {t("common.backToHome")}
        </Link>
      </MarketingHeader>

      <main className="mx-auto max-w-2xl px-4 pt-12 pb-20 sm:px-6 sm:pt-16">
        <h1 className={`${DISPLAY} text-6xl text-balance sm:text-7xl`}>{t(`legal.${doc}.title`)}</h1>
        <p className="mt-3 text-sm text-(--landing-muted)">{t("legal.updated", { date: t("legal.date") })}</p>
        <p className="mt-6 text-lg leading-relaxed text-pretty">{t(`legal.${doc}.intro`, values)}</p>
        <div className="mt-10 space-y-10 leading-relaxed [&_a]:rounded-sm [&_a]:text-(--landing-accent) [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-2xl [&_h2]:font-bold [&_li]:mt-2 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
          {Object.entries(sections).map(([id, section]) => {
            const base = `legal.${doc}.sections.${id}`;
            return (
              <section key={id}>
                <h2>{section.h}</h2>
                {section.p && <p>{rich(`${base}.p`)}</p>}
                {section.items && (
                  <ul>
                    {Object.keys(section.items).map((item) => (
                      <li key={item}>{rich(`${base}.items.${item}`)}</li>
                    ))}
                  </ul>
                )}
                {section.after && <p>{rich(`${base}.after`)}</p>}
                {doc === "cookies" && id === "cookies" && (
                  <StorageTable rows={COOKIES} caption={t("legal.cookies.cookiesCaption")} />
                )}
                {doc === "cookies" && id === "storage" && (
                  <StorageTable rows={BROWSER_STORAGE} caption={t("legal.cookies.storageCaption")} />
                )}
              </section>
            );
          })}
        </div>
      </main>

      <MarketingFooter />
    </MarketingShell>
  );
}

function StorageTable({
  rows,
  caption,
}: {
  rows: readonly (readonly [string, StorageRow])[];
  caption: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="mt-4 overflow-x-auto rounded-md border border-(--landing-border) bg-(--landing-card)">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-(--landing-border)">
            <th scope="col" className="px-4 py-3 font-bold">{t("legal.tableName")}</th>
            <th scope="col" className="px-4 py-3 font-bold">{t("legal.tablePurpose")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-(--landing-border)">
          {rows.map(([name, purpose]) => (
            <tr key={name}>
              <td className="px-4 py-3 align-top font-semibold whitespace-nowrap">{name}</td>
              <td className="px-4 py-3 align-top text-(--landing-muted)">{t(`legal.cookies.rows.${purpose}`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
