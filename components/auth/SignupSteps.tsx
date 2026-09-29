"use client";

import { useTranslation } from "react-i18next";
import { DISPLAY } from "@/components/marketing/typeScale";

/** What an owner does from signup to a first service, in order (WorkspaceSetupFlow, then admin). */
export const SIGNUP_STEPS = ["account", "connections", "business", "menu"] as const;

/**
 * The setup order beside the signup form. The first step is the one on screen,
 * tagged like a new ticket on the rail.
 */
export function SignupSteps() {
  const { t } = useTranslation();
  return (
    <section aria-labelledby="signup-steps-title">
      <h2 id="signup-steps-title" className="text-xl font-bold">
        {t("auth.steps.title")}
      </h2>
      <ol className="mt-6">
        {SIGNUP_STEPS.map((step, i) => {
          const current = i === 0;
          const last = i === SIGNUP_STEPS.length - 1;
          return (
            <li
              key={step}
              aria-current={current ? "step" : undefined}
              className="relative grid grid-cols-[2.5rem_1fr] gap-x-3 pb-7 last:pb-0"
            >
              {/* The line joining one step to the next. */}
              {!last && <span className="absolute top-11 bottom-1 left-5 w-0.5 bg-(--landing-border)" aria-hidden />}
              <span
                className={`${DISPLAY} flex size-10 items-center justify-center rounded-full text-2xl ${
                  current
                    ? "bg-(--landing-accent) text-white"
                    : "border-2 border-(--landing-edge) bg-(--landing-bg) text-(--landing-muted)"
                }`}
                aria-hidden
              >
                {i + 1}
              </span>
              <div className="pt-1.5">
                <h3 className="flex flex-wrap items-center gap-2 font-bold">
                  {t(`auth.steps.${step}.title`)}
                  {current && (
                    <span className="rounded-md bg-(--landing-saffron) px-2 py-0.5 text-xs font-bold text-(--landing-ink)">
                      {t("auth.steps.here")}
                    </span>
                  )}
                </h3>
                <p className="mt-1 max-w-sm text-sm text-pretty text-(--landing-muted)">{t(`auth.steps.${step}.body`)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
