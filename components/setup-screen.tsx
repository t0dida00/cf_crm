"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Coffee, ForkKnife, SignOut, SquaresFour } from "@phosphor-icons/react";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEXICON } from "@/lib/lexicon";
import type { Domain } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<Domain, typeof ForkKnife> = {
  restaurant: ForkKnife,
  cafe: Coffee,
};

export function SetupScreen({
  onSubmit,
  error,
}: {
  onSubmit: (
    name: string,
    domain: Domain,
    contact: { phone: string; email: string; address: string },
  ) => void | Promise<void>;
  error?: string | null;
}) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState<Domain>("restaurant");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500 text-white">
            <SquaresFour size={15} weight="bold" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">
            WORKSPACE SETUP · STEP 1 OF 2
          </span>
          <span className="flex-1" />
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <SignOut size={14} weight="bold" />
              Sign out
            </button>
          </form>
        </div>

        <div className="rounded-xl border bg-card p-10">
          <h1 className="text-2xl font-bold">Let&apos;s set up your workspace</h1>
          <p className="mt-2 mb-8 text-sm text-muted-foreground text-pretty">
            Tell us who you are. We&apos;ll build the tables, menu and order tools that fit
            your business.
          </p>

          <Label htmlFor="business-name" className="mb-2 block text-sm font-semibold">
            Enter your business name
          </Label>
          <Input
            id="business-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Casa Marina"
            className="h-11 text-base"
          />

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="business-phone" className="mb-2 block text-sm font-semibold">
                Phone
              </Label>
              <Input
                id="business-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +34 600 000 000"
                className="h-11 text-base"
              />
            </div>
            <div>
              <Label htmlFor="business-email" className="mb-2 block text-sm font-semibold">
                Email
              </Label>
              <Input
                id="business-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. hello@casamarina.com"
                className="h-11 text-base"
              />
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="business-address" className="mb-2 block text-sm font-semibold">
              Address
            </Label>
            <Input
              id="business-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Carrer del Mar 12, Barcelona"
              className="h-11 text-base"
            />
          </div>

          <p className="mt-8 mb-3 text-sm font-semibold">What kind of business is it?</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(Object.keys(LEXICON) as Domain[]).map((key) => {
              const Icon = ICONS[key];
              const selected = domain === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDomain(key)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    selected ? "border-brand-500 bg-brand-50" : "bg-card hover:border-input",
                  )}
                >
                  <span className="flex items-center justify-between">
                    <Icon size={22} weight="bold" className="text-brand-500" />
                    {selected && (
                      <CheckCircle size={18} weight="fill" className="text-brand-500" />
                    )}
                  </span>
                  <span className="mt-3 block text-sm font-semibold">
                    {LEXICON[key].label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {LEXICON[key].blurb}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <p className="mt-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <span className="text-xs text-muted-foreground">
              You can change all of this later.
            </span>
            <Button
              disabled={!name.trim() || submitting}
              onClick={async () => {
                setSubmitting(true);
                try {
                  await onSubmit(name.trim(), domain, {
                    phone: phone.trim(),
                    email: email.trim(),
                    address: address.trim(),
                  });
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? "Building…" : "Build my workspace"}
              <ArrowRight size={16} weight="bold" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
