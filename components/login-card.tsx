"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Hourglass, PaperPlaneTilt } from "@phosphor-icons/react";
import { ContactForm } from "@/components/contact-form";
import { Input } from "@/components/ui/input";
import { RequiredLabel } from "@/components/required-label";
import { LoginSubmitButton } from "@/components/login-submit-button";
import { cn } from "@/lib/utils";

export type SignInAs = "owner" | "staff";

const SIGN_IN_AS: [SignInAs, string][] = [
  ["owner", "Owner"],
  ["staff", "Staff"],
];
/** Remembers this browser's last choice (a convenience only). */
const SIGN_IN_AS_KEY = "tably:sign-in-as";

/** What to tell the user after a failed sign-in. `warning`: not an error, just not yet (the account is under review). */
export function loginNotice(error?: string, code?: string): { text: string; tone: "error" | "warning" } | null {
  if (!error) return null;
  if (code === "account_pending") {
    return {
      text: "Your account is still being reviewed. We'll notify you at your registered email once it's approved.",
      tone: "warning",
    };
  }
  if (code === "account_disabled") {
    return { text: "Your account is disabled temporarily. Please contact your owner(s).", tone: "error" };
  }
  // Also what a wrong Owner / Staff choice gets: the backend can't be asked which kind an email is.
  if (error === "CredentialsSignin") return { text: "Email or password is wrong, please try again.", tone: "error" };
  return { text: "Something went wrong signing in. Please try again.", tone: "error" };
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
  const [view, setView] = useState<"sign-in" | "contact">("sign-in");
  const [signInAs, setSignInAs] = useState<SignInAs>("owner");
  const notice = loginNotice(error, code);

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
          <legend className="mb-1.5 text-sm font-medium">Sign in as</legend>
          <div className="grid grid-cols-2 gap-2">
            {SIGN_IN_AS.map(([value, label]) => (
              <label
                key={value}
                className={cn(
                  "flex h-10 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                  signInAs === value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background text-muted-foreground hover:text-foreground",
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
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-1.5">
          <RequiredLabel htmlFor="email">Email</RequiredLabel>
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
          <RequiredLabel htmlFor="password">Password</RequiredLabel>
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
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Setting up a new business?{" "}
          <Link href="/signup" className="font-semibold text-foreground underline-offset-2 hover:underline">
            Create an account
          </Link>
        </p>
      ) : (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          No account yet? Ask your owner for one, or{" "}
          <button
            type="button"
            onClick={() => setView("contact")}
            className="font-semibold text-foreground underline-offset-2 hover:underline"
          >
            contact us
          </button>
          .
        </p>
      )}
    </div>
  );
}
