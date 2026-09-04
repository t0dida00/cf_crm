"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Coffee, ForkKnife, SquaresFour } from "@phosphor-icons/react";
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
}: {
  onSubmit: (name: string, domain: Domain) => void;
}) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState<Domain>("restaurant");

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

          <p className="mt-8 mb-3 text-sm font-semibold">What kind of business is it?</p>
          <div className="grid grid-cols-2 gap-3">
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

          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <span className="text-xs text-muted-foreground">
              You can change all of this later.
            </span>
            <Button disabled={!name.trim()} onClick={() => onSubmit(name.trim(), domain)}>
              Build my workspace
              <ArrowRight size={16} weight="bold" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
