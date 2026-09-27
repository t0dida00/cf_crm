"use client";

import { useActionState, useState, type FocusEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hourglass } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { FieldError, fieldErrorProps } from "@/components/field-error";
import { validateSignup, withFieldError, type FieldErrors } from "@/lib/validation";
import { focusFirstInvalid } from "@/lib/focus";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/required-label";
import { LoginSubmitButton } from "@/components/login-submit-button";

export const MIN_PASSWORD_LENGTH = 8;

/** What the signup action answers: the account waiting for review, or null (it redirected). */
export type SignupState = { pending: { fullName: string; email: string } } | null;

export function signupErrorMessage(error?: string, message?: string): string | null {
  if (!error) return null;
  if (error === "exists") return "An account with this email already exists. Sign in instead.";
  if (error === "invalid") return message || "Check your details and try again.";
  return "Something went wrong creating your account. Please try again.";
}

/** Shown instead of the form once an account is waiting for review; OK goes to sign in. */
function PendingReview({ fullName, email }: { fullName: string; email: string }) {
  const router = useRouter();
  return (
    <div className="rounded-xl border bg-card p-10">
      <span className="mb-5 flex size-11 items-center justify-center rounded-full bg-brand-500/10 text-brand-700">
        <Hourglass size={22} weight="bold" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold">Dear {fullName},</h1>
      <p role="status" className="mt-3 text-sm text-muted-foreground text-pretty">
        Your request is being reviewed. We&apos;ll notify you at <strong className="text-foreground">{email}</strong>{" "}
        once your account is approved. Then you can sign in and set up your business.
      </p>
      <Button className="mt-8 h-11 w-full text-base" size="lg" onClick={() => router.push("/login")}>
        OK
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
  const errorText = signupErrorMessage(error, message);
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
    <div className="rounded-xl border bg-card p-10">
      <h1 className="text-2xl font-bold">Create your owner account</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground text-pretty">
        Next you&apos;ll set up your business. You can add staff accounts from the admin panel.
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
          <RequiredLabel htmlFor="fullName">Full name</RequiredLabel>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            required
            placeholder="Ana Ruiz"
            {...fieldErrorProps("fullName", errors.fullName)}
            onBlur={blur("fullName")}
          />
          <FieldError id="fullName" message={errors.fullName} />
        </div>
        <div className="space-y-1.5">
          <RequiredLabel htmlFor="email">Email</RequiredLabel>
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
          <RequiredLabel htmlFor="password">Password</RequiredLabel>
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
            At least {MIN_PASSWORD_LENGTH} characters.
          </p>
        </div>
        <LoginSubmitButton label="Create account" pendingLabel="Creating account…" />
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-foreground underline-offset-2 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
