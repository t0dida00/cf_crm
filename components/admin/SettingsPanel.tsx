"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import { FALLBACK_LINES, ReceiptPreview, type SampleLine } from "./ReceiptPreview";
import { toast } from "sonner";
import { savedMessage } from "@/hooks/useAsyncAction";
import { FieldError, fieldErrorProps } from "@/components/common/FieldError";
import { RequiredLabel } from "@/components/common/RequiredLabel";
import { percentError, blockInvalidNumberKeys, sanitizePhone, validateBusiness, type FieldErrors, MAX_COMMON_TAX, MAX_SPECIAL_TAX, acceptNumberInput, withFieldError } from "@/lib/validation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import type { SpecialTax } from "@/lib/types";

/** Stored as the symbol; names under admin.settings.currencies. */
const CURRENCIES = [
  { value: "€", key: "eur" },
  { value: "$", key: "usd" },
  { value: "£", key: "gbp" },
  { value: "₫", key: "vnd" },
] as const;

let draftCounter = 0;
const nextDraftId = () => `draft-${draftCounter++}`;

export function SettingsPanel() {
  const { t } = useTranslation();
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
    const rateProblem = percentError(String(billingDraft.taxRate), "commonTax", MAX_COMMON_TAX);
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
      toast.success(savedMessage());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  // The receipt preview's lines: a few of the real menu's dishes.
  const sampleLines = useMemo<SampleLine[]>(() => {
    const dishes = workspace.dishes.filter((d) => d.status === "valid").slice(0, 3);
    return dishes.length
      ? dishes.map((d, i) => ({ qty: i === 0 ? 2 : 1, name: d.name, price: d.price }))
      : FALLBACK_LINES.map(({ qty, dish, price }) => ({ qty, price, name: t(`lexicon.dishes.${dish}.name`) }));
  }, [workspace.dishes, t]);

  return (
    <Card className="max-w-xl xl:max-w-none">
      <CardContent className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">{t("admin.settings.restaurant")}</h2>
          <div className="mt-4 space-y-4">
            {/* The logo sits beside the name, at about the size it shows in the app. */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="space-y-1.5">
              <Label>{t("admin.settings.logo")}</Label>
              <ImageDropzone
                label={t("common.image.logo")}
                value={profileDraft.logoUrl}
                onChange={(logoUrl) => setProfileDraft((d) => ({ ...d, logoUrl }))}
                className="size-32"
                placeholder={t("admin.settings.logoPlaceholder")}
              />
            </div>
            {/* Name, phone and address stack in one column beside the logo. */}
            <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="restaurant-name">{t("admin.settings.name")}</RequiredLabel>
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
              <div className="space-y-1.5">
                <RequiredLabel htmlFor="restaurant-phone">{t("admin.settings.phone")}</RequiredLabel>
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
                <RequiredLabel htmlFor="restaurant-address">{t("admin.settings.address")}</RequiredLabel>
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
        </div>

        <div className="border-t pt-5">
          <h2 className="text-lg font-semibold">{t("admin.settings.billing")}</h2>
          <div className="mt-4 grid items-start gap-6 sm:grid-cols-[minmax(0,1fr)_15rem]">
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="tax-rate">{t("admin.settings.commonTax")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tax-rate"
                  type="number"
                  min={0}
                  max={MAX_COMMON_TAX}
                  step="0.01"
                  onKeyDown={blockInvalidNumberKeys()}
                  {...fieldErrorProps("tax-rate", taxRateError)}
                  onBlur={() => setTaxRateError(percentError(String(billingDraft.taxRate), "commonTax", MAX_COMMON_TAX))}
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
              <Label htmlFor="settings-currency">{t("admin.settings.currency")}</Label>
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
                      {t(`admin.settings.currencies.${c.key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ReceiptPreview
            name={profileDraft.name}
            address={profileDraft.address}
            phone={profileDraft.phone}
            taxRate={Number(billingDraft.taxRate) || 0}
            currency={billingDraft.currency}
            lines={sampleLines}
          />
          </div>
        </div>

        <div className="border-t pt-5">
          <h2 className="text-lg font-semibold">{t("admin.settings.specialTaxes")}</h2>
          <p className="mt-1 mb-3.5 text-[13px] text-muted-foreground">
            {t("admin.settings.specialHelp")}
          </p>

          {taxesDraft.length === 0 ? (
            <p className="border-t py-2.5 text-sm text-muted-foreground">
              {t("admin.settings.noSpecial")}
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
                  aria-label={t("admin.settings.remove", { name: tax.name })}
                >
                  <Trash size={15} weight="bold" />
                </button>
              </div>
            ))
          )}

          <div className="mt-3.5 flex items-center gap-2.5">
            <Input
              value={newTax.name}
              placeholder={t("admin.settings.taxName")}
              aria-label={t("admin.settings.newTaxName")}
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
              aria-label={t("admin.settings.newTaxPct")}
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
                  ? t("admin.settings.taxNameRequired")
                  : !newTax.pct.trim()
                    ? t("admin.settings.taxPctRequired")
                    : percentError(newTax.pct, "taxPercentage", MAX_SPECIAL_TAX);
                setNewTaxError(problem);
                if (problem) return;
                setTaxesDraft((list) => [...list, { id: nextDraftId(), name, pct }]);
                setNewTax({ name: "", pct: "" });
              }}
            >
              {t("admin.settings.add")}
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
            {saving ? t("admin.settings.saving") : t("admin.settings.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
