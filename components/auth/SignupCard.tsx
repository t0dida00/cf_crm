"use client";

import { useActionState, useState, type FocusEvent, type FormEvent } from "react";
import { Trans, useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hourglass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { FieldError, fieldErrorProps } from "@/components/common/FieldError";
import { validateSignup, withFieldError, type FieldErrors } from "@/lib/validation";
import { focusFirstInvalid } from "@/lib/focus";
import { Input } from "@/components/ui/Input";
import { RequiredLabel } from "@/components/common/RequiredLabel";
import { DISPLAY } from "@/components/marketing/typeScale";
import { LoginSubmitButton } from "./LoginSubmitButton";

export const MIN_PASSWORD_LENGTH = 8;

/** What the signup action answers: the account waiting for review, or null (it redirected). */
export type SignupState = { pending: { fullName: string; email: string } } | null;

export function signupErrorMessage(t: TFunction, error?: string, message?: string): string | null {
  if (!error) return null;
  if (error === "exists") return t("auth.signup.exists");
  if (error === "invalid") return message || t("auth.signup.invalid");
  return t("auth.signup.failed");
}

/** Shown instead of the form once an account is waiting for review; OK goes to sign in. */
function PendingReview({ fullName, email }: { fullName: string; email: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <div>
      <span className="mb-5 flex size-11 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600">
        <Hourglass size={22} weight="bold" aria-hidden />
      </span>
      <h1 className={`${DISPLAY} text-5xl text-balance`}>{t("auth.signup.pendingTitle", { name: fullName })}</h1>
      <p role="status" className="mt-3 text-muted-foreground text-pretty">
        <Trans i18nKey="auth.signup.pendingBody" values={{ email }} components={{ b: <strong className="text-foreground" /> }} />
      </p>
      <Button className="mt-8 h-11 w-full text-base" size="lg" onClick={() => router.push("/login")}>
        {t("auth.signup.ok")}
      </Button>
    </div>
  );
}

/**
 * Owner signup: the new account then sets up its business on "/". When new
 * accounts need review, the action answers `pending` and the card shows
 * PendingReview instead of signing in.
 */
export function SignupCard({
  signUp,
  error,
  message,
}: {
  signUp: (prev: SignupState, formData: FormData) => Promise<SignupState>;
  error?: string;
  message?: string;
}) {
  const [state, formAction] = useActionState(signUp, null);
  const { t } = useTranslation();
  const errorText = signupErrorMessage(t, error, message);
  const [errors, setErrors] = useState<FieldErrors<"fullName" | "email" | "password">>({});

  const validateForm = (form: HTMLFormElement) => {
    const data = new FormData(form);
    return validateSignup({
      fullName: String(data.get("fullName") ?? ""),
      email: String(data.get("email") ?? ""),
      password: String(data.get("password") ?? ""),
    });
  };

  // Checked here first; the backend re-checks the same rules.
  const check = (e: FormEvent<HTMLFormElement>) => {
    const found = validateForm(e.currentTarget);
    setErrors(found);
    if (Object.keys(found).length) {
      e.preventDefault();
      focusFirstInvalid(e.currentTarget);
    }
  };

  // Leaving a field shows its error straight away.
  const blur = (field: "fullName" | "email" | "password") => (e: FocusEvent<HTMLInputElement>) => {
    // Read the form now: React clears currentTarget once the handler returns.
    const form = e.currentTarget.form;
    if (!form) return;
    const message = validateForm(form)[field];
    setErrors((prev) => withFieldError(prev, field, message));
  };

  if (state?.pending) return <PendingReview {...state.pending} />;

  return (
    <div>
      <h1 className={`${DISPLAY} text-5xl text-balance sm:text-6xl`}>{t("auth.signup.title")}</h1>
      <p className="mt-3 mb-7 text-muted-foreground text-pretty">
        {t("auth.signup.body")}
      </p>

      {errorText && (
        <p
          role="alert"
          className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          {errorText}
        </p>
      )}

      <form action={formAction} onSubmit={check} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <RequiredLabel htmlFor="fullName">{t("auth.signup.fullName")}</RequiredLabel>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            placeholder={t("auth.signup.fullNamePlaceholder")}
            {...fieldErrorProps("fullName", errors.fullName)}
            onBlur={blur("fullName")}
          />
          <FieldError id="fullName" message={errors.fullName} />
        </div>
        <div className="space-y-1.5">
          <RequiredLabel htmlFor="email">{t("auth.email")}</RequiredLabel>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            {...fieldErrorProps("email", errors.email)}
            onBlur={blur("email")}
          />
          <FieldError id="email" message={errors.email} />
        </div>
        <div className="space-y-1.5">
          <RequiredLabel htmlFor="password">{t("auth.password")}</RequiredLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            aria-describedby={errors.password ? "password-error password-hint" : "password-hint"}
            aria-invalid={errors.password ? true : undefined}
            onBlur={blur("password")}
          />
          <FieldError id="password" message={errors.password} />
          <p id="password-hint" className="text-xs text-muted-foreground">
            {t("auth.signup.passwordHint", { n: MIN_PASSWORD_LENGTH })}
          </p>
        </div>
        <LoginSubmitButton label={t("auth.signup.submit")} pendingLabel={t("auth.signup.submitting")} />
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {t("auth.signup.haveAccount")}{" "}
        <Link href="/login" className="rounded-sm font-semibold text-primary underline underline-offset-4">
          {t("auth.signIn")}
        </Link>
      </p>
    </div>
  );
}
