"use client";

import { useState } from "react";
import { Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/components/workspace-provider";

const CURRENCIES = [
  { value: "€", label: "Euro (€)" },
  { value: "$", label: "US dollar ($)" },
  { value: "£", label: "Pound sterling (£)" },
];

export function SettingsPanel() {
  const { workspace, fmt, updateSettings, addSpecialTax, removeSpecialTax } =
    useWorkspace();
  const { taxRate, currency, specialTaxes } = workspace.settings;
  const [draft, setDraft] = useState({ name: "", pct: "" });

  const taxOnHundred = 100 - 100 / (1 + taxRate / 100);

  return (
    <Card className="max-w-xl">
      <CardContent className="space-y-5">
        <div>
          <p className="text-lg font-semibold">Billing</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tax-rate">Common tax</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tax-rate"
                  type="number"
                  value={String(taxRate)}
                  onChange={(e) => updateSettings({ taxRate: Number(e.target.value) || 0 })}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select
                value={currency}
                onValueChange={(value) => updateSettings({ currency: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="mt-4 text-[13px] text-muted-foreground text-pretty">
            The common tax applies to every order. On a {fmt(100)} order that is{" "}
            {fmt(taxOnHundred)}.
          </p>
        </div>

        <div className="border-t pt-5">
          <p className="text-lg font-semibold">Special Taxes</p>
          <p className="mt-1 mb-3.5 text-[13px] text-muted-foreground">
            Optional. Define them here, then apply one to a dish from the Menu tab.
          </p>

          {specialTaxes.length === 0 ? (
            <p className="border-t py-2.5 text-sm text-muted-foreground">
              No special taxes yet.
            </p>
          ) : (
            specialTaxes.map((tax, i) => (
              <div key={tax.name} className="flex items-center gap-3 border-t py-2.5">
                <span className="flex-1 text-[15px]">{tax.name}</span>
                <span className="font-semibold">{tax.pct}%</span>
                <button
                  type="button"
                  onClick={() => removeSpecialTax(i)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={`Remove ${tax.name}`}
                >
                  <Trash size={15} weight="bold" />
                </button>
              </div>
            ))
          )}

          <div className="mt-3.5 flex items-center gap-2.5">
            <Input
              value={draft.name}
              placeholder="Tax name"
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            />
            <Input
              type="number"
              value={draft.pct}
              placeholder="%"
              className="w-22"
              onChange={(e) => setDraft((d) => ({ ...d, pct: e.target.value }))}
            />
            <Button
              variant="outline"
              onClick={() => {
                const name = draft.name.trim();
                const pct = Number(draft.pct);
                if (!name || !Number.isFinite(pct)) return;
                addSpecialTax({ name, pct });
                setDraft({ name: "", pct: "" });
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
