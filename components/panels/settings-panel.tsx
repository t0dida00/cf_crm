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
import { toast } from "sonner";
import { SAVED_MESSAGE } from "@/hooks/use-async-action";
import { FieldError, fieldErrorProps } from "@/components/field-error";
import { RequiredLabel } from "@/components/required-label";
import { percentError, blockInvalidNumberKeys, sanitizePhone, validateBusiness, type FieldErrors, MAX_COMMON_TAX, MAX_SPECIAL_TAX, acceptNumberInput, withFieldError } from "@/lib/validation";
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

  const [profileErrors, setProfileErrors] = useState<FieldErrors<"name" | "phone" | "address">>({});
  const [taxRateError, setTaxRateError] = useState<string | undefined>();
  const [newTaxError, setNewTaxError] = useState<string | undefined>();

  const handleSave = async () => {
    const found = profileDirty ? validateBusiness(profileDraft) : {};
    setProfileErrors(found);
    const rateProblem = percentError(String(billingDraft.taxRate), "Common tax", MAX_COMMON_TAX);
    setTaxRateError(rateProblem);
    if (Object.keys(found).length || rateProblem) return;
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
      toast.success(SAVED_MESSAGE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const taxOnHundred = 100 - 100 / (1 + Number(billingDraft.taxRate || 0) / 100);

  return (
    <Card className="max-w-xl xl:max-w-none">
      <CardContent className="space-y-5">
        <div>
          <p className="text-lg font-semibold">Restaurant</p>
          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Logo</Label>
              <ImageDropzone
                label="logo"
                value={profileDraft.logoUrl}
                onChange={(logoUrl) => setProfileDraft((d) => ({ ...d, logoUrl }))}
                className="size-[300px]"
                placeholder="Drop a logo, or click to browse"
              />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="restaurant-name">Name</RequiredLabel>
              <Input
                id="restaurant-name"
                required
                {...fieldErrorProps("restaurant-name", profileErrors.name)}
                onBlur={() => setProfileErrors((e) => withFieldError(e, "name", validateBusiness(profileDraft).name))}
                value={profileDraft.name}
                onChange={(e) =>
                  setProfileDraft((d) => ({ ...d, name: e.target.value }))
                }
              />
              <FieldError id="restaurant-name" message={profileErrors.name} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <RequiredLabel htmlFor="restaurant-phone">Phone</RequiredLabel>
                <Input
                  id="restaurant-phone"
                  type="tel"
                  inputMode="tel"
                  required
                  value={profileDraft.phone}
                  onChange={(e) =>
                    setProfileDraft((d) => ({ ...d, phone: sanitizePhone(e.target.value) }))
                  }
                  {...fieldErrorProps("restaurant-phone", profileErrors.phone)}
                  onBlur={() => setProfileErrors((e) => withFieldError(e, "phone", validateBusiness(profileDraft).phone))}
                />
                <FieldError id="restaurant-phone" message={profileErrors.phone} />
              </div>
              <div className="space-y-1.5">
                <RequiredLabel htmlFor="restaurant-address">Address</RequiredLabel>
                <Input
                  id="restaurant-address"
                  required
                  value={profileDraft.address}
                  onChange={(e) =>
                    setProfileDraft((d) => ({ ...d, address: e.target.value }))
                  }
                  {...fieldErrorProps("restaurant-address", profileErrors.address)}
                  onBlur={() => setProfileErrors((e) => withFieldError(e, "address", validateBusiness(profileDraft).address))}
                />
                <FieldError id="restaurant-address" message={profileErrors.address} />
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
                  min={0}
                  max={MAX_COMMON_TAX}
                  step="0.01"
                  onKeyDown={blockInvalidNumberKeys()}
                  {...fieldErrorProps("tax-rate", taxRateError)}
                  onBlur={() => setTaxRateError(percentError(String(billingDraft.taxRate), "Common tax", MAX_COMMON_TAX))}
                  value={billingDraft.taxRate}
                  onChange={(e) => {
                    // Never more than 100%: a keystroke that would exceed it is ignored.
                    const taxRate = acceptNumberInput(e.target.value, MAX_COMMON_TAX);
                    if (taxRate !== null) setBillingDraft((d) => ({ ...d, taxRate }));
                  }}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <FieldError id="tax-rate" message={taxRateError} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settings-currency">Currency</Label>
              <Select
                value={billingDraft.currency}
                onValueChange={(value) =>
                  setBillingDraft((d) => ({ ...d, currency: value }))
                }
              >
                <SelectTrigger id="settings-currency" className="w-full">
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
                  className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive"
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
              aria-label="New tax name"
              onChange={(e) => setNewTax((d) => ({ ...d, name: e.target.value }))}
            />
            <Input
              type="number"
              min={0}
              max={MAX_SPECIAL_TAX}
              step="0.01"
              onKeyDown={blockInvalidNumberKeys()}
              {...fieldErrorProps("new-tax-pct", newTaxError)}
              value={newTax.pct}
              placeholder="%"
              aria-label="New tax percentage"
              className="w-22"
              onChange={(e) => {
                const pct = acceptNumberInput(e.target.value, MAX_SPECIAL_TAX);
                if (pct !== null) setNewTax((d) => ({ ...d, pct }));
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                const name = newTax.name.trim();
                const pct = Number(newTax.pct);
                const problem = !name
                  ? "Tax name is required."
                  : !newTax.pct.trim()
                    ? "Tax percentage is required."
                    : percentError(newTax.pct, "Tax percentage", MAX_SPECIAL_TAX);
                setNewTaxError(problem);
                if (problem) return;
                setTaxesDraft((list) => [...list, { id: nextDraftId(), name, pct }]);
                setNewTax({ name: "", pct: "" });
              }}
            >
              Add
            </Button>
          </div>
          <FieldError id="new-tax-pct" message={newTaxError} />
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
            disabled={!dirty || saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
