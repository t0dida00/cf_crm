"use client";

import { useState } from "react";
import { ArrowLeft, PaperPlaneTilt } from "@phosphor-icons/react";
import { ContactForm } from "@/components/contact-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginSubmitButton } from "@/components/login-submit-button";

export function LoginCard({
  loginWithCredentials,
  error,
  code,
}: {
  loginWithCredentials: (formData: FormData) => Promise<void>;
  error?: string;
  code?: string;
}) {
  const [view, setView] = useState<"sign-in" | "contact">("sign-in");

  if (view === "contact") {
    return (
      <div className="rounded-xl border bg-card p-6">
        <button
          type="button"
          onClick={() => setView("sign-in")}
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={15} weight="bold" />
          Back to sign in
        </button>
      
        <h1 className="mt-4 text-2xl font-bold">Request an account</h1>
        <p className="mt-2 mb-8 text-sm text-muted-foreground text-pretty">
          Tell us a bit about your business and we&apos;ll set you up with staff and admin
          access.
        </p>
        <ContactForm stacked />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-10">
      <h1 className="text-2xl font-bold">Staff &amp; admin sign in</h1>
      <p className="mt-2 mb-8 text-sm text-muted-foreground text-pretty">
        Access to the admin and staff dashboards is restricted.
      </p>

      {error && (
        <p className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {code === "account_disabled"
            ? "Your account is disabled temporarily. Please contact your owner(s)."
            : error === "AccessDenied"
              ? "That account isn't allowed. Sign in with a @gmail.com account."
              : error === "CredentialsSignin"
                ? "Invalid email or password."
                : "Something went wrong signing in. Please try again."}
        </p>
      )}

      <form action={loginWithCredentials} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
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
          <Label htmlFor="password">Password</Label>
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

      <p className="mt-6 text-center text-xs text-muted-foreground">
        No account?{" "}
        <button
          type="button"
          onClick={() => setView("contact")}
          className="font-semibold text-foreground underline-offset-2 hover:underline"
        >
          Contact the administrator
        </button>{" "}
        to create a new account.
      </p>
    </div>
  );
}
