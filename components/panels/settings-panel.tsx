"use client";

import { useEffect, useState } from "react";
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
import { ImageDropzone } from "@/components/image-dropzone";
import { useWorkspace } from "@/components/workspace-provider";
import type { SpecialTax } from "@/lib/types";

const CURRENCIES = [
  { value: "€", label: "Euro (€)" },
  { value: "$", label: "US dollar ($)" },
  { value: "£", label: "Pound sterling (£)" },
];

let draftCounter = 0;
const nextDraftId = () => `draft-${draftCounter++}`;

export function SettingsPanel() {
  const { workspace, fmt, updateSettings, updateProfile, addSpecialTax, removeSpecialTax } =
    useWorkspace();
  const { taxRate, currency, specialTaxes } = workspace.settings;
  const { name, phone, address, logoUrl } = workspace;

  const [profileDraft, setProfileDraft] = useState({
    name,
    phone: phone ?? "",
    address: address ?? "",
    logoUrl: logoUrl ?? "",
  });
  const [billingDraft, setBillingDraft] = useState({ taxRate: String(taxRate), currency });
  const [taxesDraft, setTaxesDraft] = useState<SpecialTax[]>(specialTaxes);
  const [newTax, setNewTax] = useState({ name: "", pct: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setProfileDraft({ name, phone: phone ?? "", address: address ?? "", logoUrl: logoUrl ?? "" });
  }, [name, phone, address, logoUrl]);

  useEffect(() => {
    setBillingDraft({ taxRate: String(taxRate), currency });
    setTaxesDraft(specialTaxes);
  }, [taxRate, currency, specialTaxes]);

  const removedIds = specialTaxes
    .filter((t) => !taxesDraft.some((d) => d.id === t.id))
    .map((t) => t.id);
  const addedTaxes = taxesDraft.filter((t) => t.id.startsWith("draft-"));

  const profileDirty =
    profileDraft.name.trim() !== name ||
    profileDraft.phone !== (phone ?? "") ||
    profileDraft.address !== (address ?? "") ||
    profileDraft.logoUrl !== (logoUrl ?? "");

  const dirty =
    profileDirty ||
    Number(billingDraft.taxRate) !== taxRate ||
    billingDraft.currency !== currency ||
    removedIds.length > 0 ||
    addedTaxes.length > 0;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (profileDirty) {
        await updateProfile({
          name: profileDraft.name.trim(),
          phone: profileDraft.phone.trim(),
          address: profileDraft.address.trim(),
          logoUrl: profileDraft.logoUrl.trim(),
        });
      }
      if (Number(billingDraft.taxRate) !== taxRate || billingDraft.currency !== currency) {
        await updateSettings({
          taxRate: Number(billingDraft.taxRate) || 0,
          currency: billingDraft.currency,
        });
      }
      for (const id of removedIds) {
        await removeSpecialTax(id);
      }
      for (const tax of addedTaxes) {
        await addSpecialTax({ name: tax.name, pct: tax.pct });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const taxOnHundred = 100 - 100 / (1 + Number(billingDraft.taxRate || 0) / 100);

  return (
    <Card className="max-w-xl">
      <CardContent className="space-y-5">
        <div>
          <p className="text-lg font-semibold">Restaurant</p>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <ImageDropzone
                value={profileDraft.logoUrl}
                onChange={(logoUrl) => setProfileDraft((d) => ({ ...d, logoUrl }))}
                className="size-[300px]"
                placeholder="Drop a logo, or click to browse"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="restaurant-name">Name</Label>
              <Input
                id="restaurant-name"
                value={profileDraft.name}
                onChange={(e) =>
                  setProfileDraft((d) => ({ ...d, name: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="restaurant-phone">Phone</Label>
                <Input
                  id="restaurant-phone"
                  type="tel"
                  value={profileDraft.phone}
                  onChange={(e) =>
                    setProfileDraft((d) => ({ ...d, phone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="restaurant-address">Address</Label>
                <Input
                  id="restaurant-address"
                  value={profileDraft.address}
                  onChange={(e) =>
                    setProfileDraft((d) => ({ ...d, address: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-5">
          <p className="text-lg font-semibold">Billing</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tax-rate">Common tax</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tax-rate"
                  type="number"
                  value={billingDraft.taxRate}
                  onChange={(e) =>
                    setBillingDraft((d) => ({ ...d, taxRate: e.target.value }))
                  }
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select
                value={billingDraft.currency}
                onValueChange={(value) =>
                  setBillingDraft((d) => ({ ...d, currency: value }))
                }
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

          {taxesDraft.length === 0 ? (
            <p className="border-t py-2.5 text-sm text-muted-foreground">
              No special taxes yet.
            </p>
          ) : (
            taxesDraft.map((tax) => (
              <div key={tax.id} className="flex items-center gap-3 border-t py-2.5">
                <span className="flex-1 text-[15px]">{tax.name}</span>
                <span className="font-semibold">{tax.pct}%</span>
                <button
                  type="button"
                  onClick={() =>
                    setTaxesDraft((list) => list.filter((t) => t.id !== tax.id))
                  }
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
              value={newTax.name}
              placeholder="Tax name"
              onChange={(e) => setNewTax((d) => ({ ...d, name: e.target.value }))}
            />
            <Input
              type="number"
              value={newTax.pct}
              placeholder="%"
              className="w-22"
              onChange={(e) => setNewTax((d) => ({ ...d, pct: e.target.value }))}
            />
            <Button
              variant="outline"
              onClick={() => {
                const name = newTax.name.trim();
                const pct = Number(newTax.pct);
                if (!name || !Number.isFinite(pct)) return;
                setTaxesDraft((list) => [...list, { id: nextDraftId(), name, pct }]);
                setNewTax({ name: "", pct: "" });
              }}
            >
              Add
            </Button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex justify-end border-t pt-5">
          <Button
            onClick={handleSave}
            loading={saving}
            disabled={!dirty || saving || !profileDraft.name.trim()}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
