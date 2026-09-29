"use client";

import { Trans, useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { intlLocale } from "@/lib/i18n";
import { useState, type FormEvent } from "react";
import { CheckCircle, Database, ImageSquare, Lightning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RequiredLabel } from "@/components/common/RequiredLabel";
import { Textarea } from "@/components/ui/Textarea";
import { ErrorState, LoadingState } from "@/components/common/RequestState";
import {
  useConnections,
  type Connections,
  type ConnectionsInput,
  type StorageInput,
  type StorageProvider,
} from "@/hooks/useConnections";
import { toast } from "sonner";
import { savedMessage } from "@/hooks/useAsyncAction";
import { parsePusherSnippet, type PusherFields } from "@/lib/pusherSnippet";

const EMPTY = {
  databaseUrl: "",
  appId: "",
  key: "",
  secret: "",
  cluster: "",
  storageProvider: "vercel_blob" as StorageProvider,
  blobToken: "",
  s3Endpoint: "",
  s3Region: "",
  s3Bucket: "",
  s3PublicUrl: "",
  s3AccessKeyId: "",
  s3SecretAccessKey: "",
};

const STORAGE_PROVIDERS: [StorageProvider, string][] = [
  ["vercel_blob", "Vercel Blob"],
  ["s3", "S3-compatible"],
];

/** The form's fields back from a request, e.g. to fill it in again after going back. */
function fromInput(input: ConnectionsInput): typeof EMPTY {
  const { databaseUrl, pusher, storage } = input;
  return {
    ...EMPTY,
    databaseUrl,
    ...pusher,
    storageProvider: storage.provider,
    ...(storage.provider === "vercel_blob"
      ? { blobToken: storage.token }
      : {
          s3Endpoint: storage.endpoint,
          s3Region: storage.region,
          s3Bucket: storage.bucket,
          s3PublicUrl: storage.publicUrl,
          s3AccessKeyId: storage.accessKeyId,
          s3SecretAccessKey: storage.secretAccessKey,
        }),
  };
}

/** The storage part of the save request, for the chosen provider only. */
function toStorageInput(form: typeof EMPTY): StorageInput {
  if (form.storageProvider === "vercel_blob") return { provider: "vercel_blob", token: form.blobToken.trim() };
  return {
    provider: "s3",
    endpoint: form.s3Endpoint.trim(),
    region: form.s3Region.trim(),
    bucket: form.s3Bucket.trim(),
    accessKeyId: form.s3AccessKeyId.trim(),
    secretAccessKey: form.s3SecretAccessKey.trim(),
    publicUrl: form.s3PublicUrl.trim(),
  };
}

// These fields hold passwords and secrets: keep writing assistants such as
// Grammarly (which send text to their servers) and autofill out of them.
const SECRET_FIELD_PROPS = {
  autoComplete: "off",
  spellCheck: false,
  "data-gramm": "false",
  "data-gramm_editor": "false",
  "data-enable-grammarly": "false",
  "data-1p-ignore": true,
  "data-lpignore": "true",
} as const;

/** "app ID, key and secret" ("app ID, key và secret"), in the language in use. */
const listNames = (names: string[], and: string) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} ${and} ${names[names.length - 1]}`;

/** ", checked 3 Oct 2026" after a connection's name, dated in the language in use. */
const checkedOn = (t: TFunction, at: string | null) =>
  at
    ? `, ${t("onboarding.form.checked", {
        date: new Date(at).toLocaleDateString(intlLocale(), { day: "numeric", month: "short", year: "numeric" }),
      })}`
    : "";

/** True once the business's database, Pusher and storage are all its own. */
export const connectedAll = (c: Connections | null) => !!c?.database && !!c.pusher && !!c.storage;

/** True once the business can run on its own infrastructure, or may use the shared one. */
export const connectionsReady = (c: Connections | null) => !!c && (c.sharedInfraAllowed || connectedAll(c));

function Status({ icon, title, connected }: { icon: React.ReactNode; title: string; connected: string | null }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-2 font-semibold">
        {icon}
        {title}
      </p>
      {connected ? (
        <p className="flex items-center gap-1.5 text-sm text-green-700">
          <CheckCircle size={16} weight="fill" />
          {connected}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{t("onboarding.form.notConnected")}</p>
      )}
    </div>
  );
}

/**
 * Lets the owner connect their business's own Postgres database, Pusher app
 * and image storage (Vercel Blob or S3-compatible) together: one "Test &
 * save" checks all three, and nothing is saved unless all pass. Secrets are
 * never shown again once saved. `onSaved` runs after a successful save.
 *
 * With `onChecked` (onboarding, before the business exists) it only checks:
 * "Test & continue" runs the same checks, saves nothing, and hands the input
 * over to be saved once the business is created. `initial` fills the form.
 */
export function ConnectionsForm({
  onSaved,
  onChecked,
  initial,
  inSettings = false,
}: {
  onSaved?: () => void;
  onChecked?: (input: ConnectionsInput) => void;
  initial?: ConnectionsInput | null;
  inSettings?: boolean;
}) {
  const { t } = useTranslation();
  const { connections, status, error, retry, saveConnections, checkConnections } = useConnections();
  const [form, setForm] = useState(() => (initial ? fromInput(initial) : EMPTY));
  const submitting = onChecked ? checkConnections : saveConnections;
  const [editing, setEditing] = useState(false);
  const [pasteNote, setPasteNote] = useState<string | null>(null);

  if (status === "error") return <ErrorState message={error ?? undefined} onRetry={retry} />;
  if (!connections) return <LoadingState />;

  const showForm = !connectedAll(connections) || editing;
  const set = (field: Exclude<keyof typeof EMPTY, "storageProvider">) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // Fills the Pusher fields from the snippet Pusher's App Keys "Copy" button
  // gives. The paste box is cleared right away so the secret doesn't stay on screen.
  const pasteSnippet = (text: string) => {
    if (!text.trim()) return;
    const found = parsePusherSnippet(text);
    const names = (Object.keys(found) as (keyof PusherFields)[]).map((f) => t(`onboarding.form.pusherNames.${f}`));
    setForm((f) => ({ ...f, ...found }));
    setPasteNote(
      names.length
        ? `${t("onboarding.form.pasteFilled", { names: listNames(names, t("onboarding.form.and")) })}${
            names.length < 4 ? ` ${t("onboarding.form.pasteRest")}` : ""
          }`
        : t("onboarding.form.pasteNone"),
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input: ConnectionsInput = {
      databaseUrl: form.databaseUrl.trim(),
      pusher: { appId: form.appId, key: form.key, secret: form.secret, cluster: form.cluster },
      storage: toStorageInput(form),
    };
    if (onChecked) {
      checkConnections.mutate(input, { onSuccess: () => onChecked(input) });
      return;
    }
    saveConnections.mutate(input, {
      onSuccess: () => {
        toast.success(savedMessage());
        setForm(EMPTY);
        setPasteNote(null);
        setEditing(false);
        onSaved?.();
      },
    });
  };

  return (
    <div className="space-y-5">
      {!connections.canStoreCredentials && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          {t("onboarding.form.noKey")}
        </p>
      )}

      <div className="space-y-3">
        <Status
          icon={<Database size={18} weight="bold" className="text-brand-700" />}
          title={t("onboarding.form.database")}
          connected={connections.database ? `${connections.database.label}${checkedOn(t, connections.database.verifiedAt)}` : null}
        />
        <Status
          icon={<Lightning size={18} weight="bold" className="text-brand-700" />}
          title={t("onboarding.form.pusher")}
          connected={
            connections.pusher
              ? `${t("onboarding.form.pusherApp", { id: connections.pusher.appId })}, ${connections.pusher.cluster}${checkedOn(t, connections.pusher.verifiedAt)}`
              : null
          }
        />
        <Status
          icon={<ImageSquare size={18} weight="bold" className="text-brand-700" />}
          title={t("onboarding.form.storage")}
          connected={connections.storage ? `${connections.storage.label}${checkedOn(t, connections.storage.verifiedAt)}` : null}
        />
      </div>

      {showForm ? (
        <form onSubmit={submit} className="space-y-5 border-t pt-5">
          <div className="space-y-1.5">
            <RequiredLabel htmlFor="database-url">{t("onboarding.form.databaseUrl")}</RequiredLabel>
            <Input
              id="database-url"
              type="text"
              // Some hosted database URLs (with API keys) are longer than 250 characters.
              maxLength={2048}
              {...SECRET_FIELD_PROPS}
              required
              value={form.databaseUrl}
              onChange={set("databaseUrl")}
              placeholder="postgresql://user:password@host:5432/database?sslmode=require"
              aria-describedby="database-help"
            />
            <p id="database-help" className="text-xs text-muted-foreground">
              <Trans i18nKey="onboarding.form.databaseHelp" components={{ b: <strong /> }} />
              {inSettings && connections.database && ` ${t("onboarding.form.databaseSwitch")}`}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pusher-paste">{t("onboarding.form.paste")}</Label>
              <Textarea
                id="pusher-paste"
                rows={3}
                value=""
                {...SECRET_FIELD_PROPS}
                onChange={(e) => pasteSnippet(e.target.value)}
                placeholder={'app_id = "…"\nkey = "…"\nsecret = "…"\ncluster = "…"'}
                aria-describedby="pusher-paste-help pusher-paste-note"
                className="font-mono text-xs"
              />
              <p id="pusher-paste-help" className="text-xs text-muted-foreground">
                <Trans i18nKey="onboarding.form.pasteHelp" components={{ b: <strong /> }} />
              </p>
              <p id="pusher-paste-note" aria-live="polite" className="text-xs font-medium text-brand-700">
                {pasteNote}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["appId", t("onboarding.form.pusherAppId"), "1234567"],
                  ["cluster", t("onboarding.form.pusherCluster"), "eu"],
                  ["key", t("onboarding.form.pusherKey"), ""],
                  ["secret", t("onboarding.form.pusherSecret"), ""],
                ] as const
              ).map(([field, label, placeholder]) => (
                <div key={field} className="space-y-1.5">
                  <RequiredLabel htmlFor={`pusher-${field}`}>{label}</RequiredLabel>
                  <Input
                    id={`pusher-${field}`}
                    type="text"
                    {...SECRET_FIELD_PROPS}
                    required
                    placeholder={placeholder}
                    value={form[field]}
                    onChange={set(field)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <fieldset className="space-y-1.5">
              <legend className="mb-1.5 text-sm font-medium">{t("onboarding.form.imageStorage")}</legend>
              <div className="flex gap-2">
                {STORAGE_PROVIDERS.map(([provider, label]) => (
                  <label
                    key={provider}
                    className={cn(
                      "flex h-8 cursor-pointer items-center rounded-md border px-3 text-sm font-medium transition-colors",
                      "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-1",
                      form.storageProvider === provider
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input-border bg-background hover:bg-secondary",
                    )}
                  >
                    <input
                      type="radio"
                      name="storage-provider"
                      value={provider}
                      checked={form.storageProvider === provider}
                      onChange={() => setForm((f) => ({ ...f, storageProvider: provider }))}
                      className="sr-only"
                    />
                    {provider === "s3" ? t("onboarding.form.s3") : label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("onboarding.form.storageHelp")}
                {inSettings && connections.storage && ` ${t("onboarding.form.storageSwitch")}`}
              </p>
            </fieldset>

            {form.storageProvider === "vercel_blob" ? (
              <div className="space-y-1.5">
                <RequiredLabel htmlFor="blob-token">{t("onboarding.form.blobToken")}</RequiredLabel>
                <Input
                  id="blob-token"
                  type="text"
                  {...SECRET_FIELD_PROPS}
                  required
                  value={form.blobToken}
                  onChange={set("blobToken")}
                  placeholder="vercel_blob_rw_…"
                  aria-describedby="blob-token-help"
                />
                <p id="blob-token-help" className="text-xs text-muted-foreground">
                  <Trans i18nKey="onboarding.form.blobHelp" components={{ b: <strong /> }} />
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["s3Endpoint", t("onboarding.form.endpoint"), "https://<account>.r2.cloudflarestorage.com", true],
                    ["s3Region", t("onboarding.form.region"), "auto", false],
                    ["s3Bucket", t("onboarding.form.bucket"), "menu-photos", true],
                    ["s3PublicUrl", t("onboarding.form.publicUrl"), "https://pub-….r2.dev", true],
                    ["s3AccessKeyId", t("onboarding.form.accessKeyId"), "", true],
                    ["s3SecretAccessKey", t("onboarding.form.secretAccessKey"), "", true],
                  ] as const
                ).map(([field, label, placeholder, required]) => (
                  <div key={field} className="space-y-1.5">
                    {required ? (
                      <RequiredLabel htmlFor={`storage-${field}`}>{label}</RequiredLabel>
                    ) : (
                      <Label htmlFor={`storage-${field}`}>{label}</Label>
                    )}
                    <Input
                      id={`storage-${field}`}
                      type="text"
                      {...SECRET_FIELD_PROPS}
                      required={required}
                      placeholder={placeholder}
                      value={form[field]}
                      onChange={set(field)}
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  <Trans i18nKey="onboarding.form.s3Help" components={{ code: <code /> }} />
                </p>
              </div>
            )}
          </div>

          {submitting.error && (
            <p role="alert" className="text-sm text-destructive">
              {submitting.error.message}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" loading={submitting.isPending} disabled={!connections.canStoreCredentials}>
              {submitting.isPending
                ? t("onboarding.form.checking")
                : onChecked
                  ? t("onboarding.form.testContinue")
                  : t("onboarding.form.testSave")}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                {t("onboarding.form.cancel")}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {onChecked ? t("onboarding.form.checkNote") : t("onboarding.form.saveNote")} {t("onboarding.form.secretsNote")}
          </p>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setEditing(true)}>
          {t("onboarding.form.replace")}
        </Button>
      )}
    </div>
  );
}
