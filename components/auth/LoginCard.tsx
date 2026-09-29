"use client";

import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import Link from "next/link";
import { ArrowLeft, Hourglass, PaperPlaneTilt } from "@phosphor-icons/react";
import { ContactForm } from "@/components/common/ContactForm";
import { Input } from "@/components/ui/Input";
import { RequiredLabel } from "@/components/common/RequiredLabel";
import { LoginSubmitButton } from "./LoginSubmitButton";
import { DISPLAY } from "@/components/marketing/typeScale";
import { cn } from "@/lib/utils";

export type SignInAs = "owner" | "staff";

const SIGN_IN_AS: SignInAs[] = ["owner", "staff"];
/** Remembers this browser's last choice (a convenience only). */
const SIGN_IN_AS_KEY = "tably:sign-in-as";

/** What to tell the user after a failed sign-in. `warning`: not an error, just not yet (the account is under review). */
export function loginNotice(
  t: TFunction,
  error?: string,
  code?: string,
): { text: string; tone: "error" | "warning" } | null {
  if (!error) return null;
  if (code === "account_pending") return { text: t("auth.notice.pending"), tone: "warning" };
  if (code === "account_disabled") return { text: t("auth.notice.disabled"), tone: "error" };
  // Also what a wrong Owner / Staff choice gets: the backend can't be asked which kind an email is.
  if (error === "CredentialsSignin") return { text: t("auth.notice.wrong"), tone: "error" };
  return { text: t("auth.notice.failed"), tone: "error" };
}

export function LoginCard({
  loginWithCredentials,
  error,
  code,
}: {
  loginWithCredentials: (formData: FormData) => Promise<void>;
  error?: string;
  code?: string;
}) {
  const { t } = useTranslation();
  const [view, setView] = useState<"sign-in" | "contact">("sign-in");
  const [signInAs, setSignInAs] = useState<SignInAs>("owner");
  const notice = loginNotice(t, error, code);

  useEffect(() => {
    try {
      if (localStorage.getItem(SIGN_IN_AS_KEY) === "staff") setSignInAs("staff");
    } catch {
      // Storage unavailable (private mode): start on Owner.
    }
  }, []);
  const choose = (next: SignInAs) => {
    setSignInAs(next);
    try {
      localStorage.setItem(SIGN_IN_AS_KEY, next);
    } catch {
      // Not remembered; the choice still applies to this sign-in.
    }
  };

  if (view === "contact") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setView("sign-in")}
          className="mb-6 flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} weight="bold" aria-hidden />
          {t("auth.backToSignIn")}
        </button>

        <h1 className={`${DISPLAY} text-5xl`}>{t("auth.requestTitle")}</h1>
        <p className="mt-2 mb-8 text-sm text-muted-foreground text-pretty">{t("auth.requestBody")}</p>
        <ContactForm stacked />
      </div>
    );
  }

  return (
    <div>
      <h1 className={`${DISPLAY} text-5xl sm:text-6xl`}>{t("auth.signInTitle")}</h1>
      <p className="mt-3 mb-7 text-muted-foreground text-pretty">{t(`auth.${signInAs}Hint`)}</p>

      {notice?.tone === "warning" && (
        <p
          role="status"
          className="mb-6 flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800"
        >
          <Hourglass size={18} weight="bold" className="mt-px shrink-0 text-amber-600" aria-hidden />
          {notice.text}
        </p>
      )}
      {notice?.tone === "error" && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {notice.text}
        </p>
      )}

      <form action={loginWithCredentials} className="space-y-4">
        <fieldset className="space-y-1.5">
          <legend className="mb-1.5 text-sm font-medium">{t("auth.signInAs")}</legend>
          <div className="grid grid-cols-2 gap-2">
            {SIGN_IN_AS.map((value) => (
              <label
                key={value}
                className={cn(
                  "flex h-10 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  signInAs === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input-border bg-background text-muted-foreground hover:text-foreground",
                )}
              >
                <input
                  type="radio"
                  name="signInAs"
                  value={value}
                  checked={signInAs === value}
                  onChange={() => choose(value)}
                  className="sr-only"
                />
                {t(`auth.${value}`)}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-1.5">
          <RequiredLabel htmlFor="email">{t("auth.email")}</RequiredLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <RequiredLabel htmlFor="password">{t("auth.password")}</RequiredLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
          />
        </div>
        <LoginSubmitButton />
      </form>

      {signInAs === "owner" ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {t("auth.newBusiness")}{" "}
          <Link href="/signup" className="rounded-sm font-semibold text-primary underline underline-offset-4">
            {t("auth.createAccount")}
          </Link>
        </p>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          <Trans
            i18nKey="auth.noAccount"
            components={{
              contact: (
                <button
                  type="button"
                  onClick={() => setView("contact")}
                  className="rounded-sm font-semibold text-primary underline underline-offset-4"
                />
              ),
            }}
          />
        </p>
      )}
    </div>
  );
}
