"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginSubmitButton } from "@/components/login-submit-button";

export const MIN_PASSWORD_LENGTH = 8;

export function signupErrorMessage(error?: string, message?: string): string | null {
  if (!error) return null;
  if (error === "exists") return "An account with this email already exists. Sign in instead.";
  if (error === "invalid") return message || "Check your details and try again.";
  return "Something went wrong creating your account. Please try again.";
}

/** Owner signup: the new account then sets up its business on "/". */
export function SignupCard({
  signUp,
  error,
  message,
}: {
  signUp: (formData: FormData) => Promise<void>;
  error?: string;
  message?: string;
}) {
  const errorText = signupErrorMessage(error, message);

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

      <form action={signUp} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" autoComplete="name" required placeholder="Ana Ruiz" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            aria-describedby="password-hint"
          />
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
