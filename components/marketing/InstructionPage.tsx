"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarCheck,
  ChartBar,
  ClockCounterClockwise,
  Download,
  Flag,
  ForkKnife,
  Gear,
  ListChecks,
  QrCode,
  Receipt,
  ShoppingCart,
  SquaresFour,
  UserPlus,
  Users,
} from "@phosphor-icons/react/ssr";
import { DISPLAY, MarketingFooter, MarketingHeader, MarketingShell } from "./MarketingTheme";

/* Words are translation keys under marketing.guide. */
const ROLES = [
  { id: "client", features: [[QrCode, "scan"], [ShoppingCart, "cart"], [Bell, "call"], [ClockCounterClockwise, "history"]] },
  {
    id: "staff",
    features: [[Receipt, "liveOrders"], [SquaresFour, "tableStatus"], [CalendarCheck, "bookings"], [ForkKnife, "menuRef"], [Bell, "requests"]],
  },
  {
    id: "admin",
    features: [
      [ChartBar, "dashboard"],
      [SquaresFour, "tablesCats"],
      [ForkKnife, "menuMgmt"],
      [Receipt, "ordersBookings"],
      [Users, "staffAccounts"],
      [QrCode, "qr"],
      [Gear, "settings"],
    ],
  },
] as const;

const WORKFLOW_STEPS = [
  [UserPlus, "account"],
  [SquaresFour, "table"],
  [QrCode, "qr"],
  [Download, "download"],
  [ForkKnife, "order"],
  [Receipt, "see"],
  [ListChecks, "status"],
] as const;

export function InstructionPage() {
  const { t } = useTranslation();
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

      <main>

        <section className="mx-auto max-w-3xl px-6 py-16 text-center sm:py-20">
          <span
            className="mx-auto flex size-11 items-center justify-center rounded-xl"
            style={{ backgroundColor: "var(--landing-card)", border: "1px solid var(--landing-border)" }}
          >
            <BookOpen size={20} weight="bold" style={{ color: "var(--landing-accent)" }} />
          </span>
          <p
            className="mt-5 text-sm font-semibold"
            style={{ color: "var(--landing-accent)" }}
          >
            {t("marketing.guide.kicker")}
          </p>
          <h1 className={`${DISPLAY} mx-auto mt-4 max-w-2xl text-6xl text-balance sm:text-7xl`}>
            {t("marketing.guide.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-pretty" style={{ color: "var(--landing-muted)" }}>
            {t("marketing.guide.intro")}
          </p>
        </section>

        {ROLES.map((role, index) => (
          <section
            key={role.id}
            id={role.id}
            className="border-t py-14"
            style={{
              borderColor: "var(--landing-border)",
              backgroundColor: index % 2 === 1 ? "var(--landing-bg-alt)" : undefined,
            }}
          >
            <div className="mx-auto max-w-6xl px-6">
              <div className="mx-auto max-w-2xl text-center">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold"
                  style={{ backgroundColor: "var(--landing-card)", border: "1px solid var(--landing-border)", color: "var(--landing-accent)" }}
                >
                  {t(`marketing.guide.roles.${role.id}.label`)}: {t(`marketing.guide.roles.${role.id}.eyebrow`)}
                </span>
                <h2 className={`${DISPLAY} mt-4 text-5xl text-balance`}>
                  {t(`marketing.guide.roles.${role.id}.title`)}
                </h2>
                <p className="mt-2.5 text-pretty" style={{ color: "var(--landing-muted)" }}>
                  {t(`marketing.guide.roles.${role.id}.body`)}
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {role.features.map(([Icon, key]) => (
                  <div
                    key={key}
                    className="rounded-2xl border p-6"
                    style={{ borderColor: "var(--landing-border)", backgroundColor: "var(--landing-card)" }}
                  >
                    <span
                      className="flex size-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "var(--landing-bg-alt)", color: "var(--landing-accent)" }}
                    >
                      <Icon size={20} weight="bold" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold">{t(`marketing.guide.features.${key}.title`)}</h3>
                    <p className="mt-1.5 text-sm text-pretty" style={{ color: "var(--landing-muted)" }}>
                      {t(`marketing.guide.features.${key}.body`)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section
          className="border-t py-14"
          style={{
            borderColor: "var(--landing-border)",
            backgroundColor: ROLES.length % 2 === 1 ? "var(--landing-bg-alt)" : undefined,
          }}
        >
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold"
                style={{ backgroundColor: "var(--landing-card)", border: "1px solid var(--landing-border)", color: "var(--landing-accent)" }}
              >
                <Flag size={13} weight="bold" />
                {t("marketing.guide.loop.kicker")}
              </span>
              <h2 className={`${DISPLAY} mt-4 text-5xl text-balance`}>
                {t("marketing.guide.loop.title")}
              </h2>
              <p className="mt-2.5 text-pretty" style={{ color: "var(--landing-muted)" }}>
                {t("marketing.guide.loop.intro")}
              </p>
            </div>

            <ol className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {WORKFLOW_STEPS.map(([Icon, key], i) => (
                <li
                  key={key}
                  className="relative rounded-2xl border p-6"
                  style={{ borderColor: "var(--landing-border)", backgroundColor: "var(--landing-card)" }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: "var(--landing-bg-alt)", color: "var(--landing-accent)" }}
                    >
                      <Icon size={20} weight="bold" />
                    </span>
                    <span
                      className="text-xs font-semibold tracking-wide"
                      style={{ color: "var(--landing-muted)" }}
                    >
                      {t("marketing.guide.loop.step", { n: i + 1 })}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{t(`marketing.guide.steps.${key}.title`)}</h3>
                  <p className="mt-1.5 text-sm text-pretty" style={{ color: "var(--landing-muted)" }}>
                    {t(`marketing.guide.steps.${key}.body`)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

      </main>

      <MarketingFooter />
    </MarketingShell>
  );
}
