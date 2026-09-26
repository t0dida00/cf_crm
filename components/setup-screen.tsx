"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Coffee, ForkKnife, SignOut, SquaresFour } from "@phosphor-icons/react";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ImageDropzone } from "@/components/image-dropzone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/required-label";
import { LEXICON } from "@/lib/lexicon";
import type { Domain } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FieldError, fieldErrorProps } from "@/components/field-error";
import { sanitizePhone, validateBusiness, type FieldErrors, withFieldError } from "@/lib/validation";

const ICONS: Record<Domain, typeof ForkKnife> = {
  restaurant: ForkKnife,
  cafe: Coffee,
};

export interface SetupDetails {
  name: string;
  domain: Domain;
  phone: string;
  address: string;
  logoUrl: string;
}

export function SetupScreen({
  onSubmit,
  error,
  initial,
}: {
  onSubmit: (
    name: string,
    domain: Domain,
    contact: { phone: string; address: string; logoUrl: string },
  ) => void | Promise<void>;
  error?: string | null;
  /** Values to start from, e.g. when coming back from step 2. */
  initial?: SetupDetails | null;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [domain, setDomain] = useState<Domain>(initial?.domain ?? "restaurant");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<"name" | "phone" | "address">>({});

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

          <div className="space-y-1.5">
            <Label className="block text-sm font-semibold">Logo</Label>
            <ImageDropzone
              value={logoUrl}
              onChange={setLogoUrl}
              className="size-[200px] max-w-full"
              placeholder="Drop a logo, or click to browse"
            />
          </div>

          <div className="mt-6">
            <RequiredLabel htmlFor="business-name" className="mb-2 block text-sm font-semibold">
              Enter your business name
            </RequiredLabel>
            <Input
              id="business-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Casa Marina"
              className="h-11 text-base"
              {...fieldErrorProps("business-name", errors.name)}
              onBlur={() => setErrors((e) => withFieldError(e, "name", validateBusiness({ name, phone, address }).name))}
            />
            <FieldError id="business-name" message={errors.name} />
          </div>

          <div className="mt-6">
            <RequiredLabel htmlFor="business-phone" className="mb-2 block text-sm font-semibold">
              Phone
            </RequiredLabel>
            <Input
              id="business-phone"
              type="tel"
              inputMode="tel"
              required
              value={phone}
              onChange={(e) => setPhone(sanitizePhone(e.target.value))}
              placeholder="e.g. +34 600 000 000"
              className="h-11 text-base"
              {...fieldErrorProps("business-phone", errors.phone)}
              onBlur={() => setErrors((e) => withFieldError(e, "phone", validateBusiness({ name, phone, address }).phone))}
            />
            <FieldError id="business-phone" message={errors.phone} />
          </div>

          <div className="mt-4">
            <RequiredLabel htmlFor="business-address" className="mb-2 block text-sm font-semibold">
              Address
            </RequiredLabel>
            <Input
              id="business-address"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Carrer del Mar 12, Barcelona"
              className="h-11 text-base"
              {...fieldErrorProps("business-address", errors.address)}
              onBlur={() => setErrors((e) => withFieldError(e, "address", validateBusiness({ name, phone, address }).address))}
            />
            <FieldError id="business-address" message={errors.address} />
            <p className="mt-2 text-xs text-muted-foreground">
              Your business email is the one you signed up with.
            </p>
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
              disabled={submitting}
              onClick={async () => {
                const found = validateBusiness({ name, phone, address });
                setErrors(found);
                if (Object.keys(found).length) return;
                setSubmitting(true);
                try {
                  await onSubmit(name.trim(), domain, {
                    phone: phone.trim(),
                    address: address.trim(),
                    logoUrl: logoUrl.trim(),
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
