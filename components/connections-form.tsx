"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle, Database, Lightning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState, LoadingState } from "@/components/request-state";
import { useConnections, type Connections } from "@/hooks/use-connections";
import { parsePusherSnippet, type PusherFields } from "@/lib/pusher-snippet";

const EMPTY = { databaseUrl: "", appId: "", key: "", secret: "", cluster: "" };

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

const FIELD_NAMES: Record<keyof PusherFields, string> = { appId: "app ID", key: "key", secret: "secret", cluster: "cluster" };

/** "app ID, key and secret" */
const listNames = (names: string[]) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

const checkedOn = (at: string | null) =>
  at ? ` · checked ${new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : "";

/** True once the business can run on its own infrastructure, or may use the shared one. */
export const connectionsReady = (c: Connections | null) =>
  !!c && (c.sharedInfraAllowed || (c.database !== null && c.pusher !== null));

function Status({ icon, title, connected }: { icon: React.ReactNode; title: string; connected: string | null }) {
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
        <p className="text-sm text-muted-foreground">Not connected: using the shared service.</p>
      )}
    </div>
  );
}

/**
 * Lets the owner connect their business's own Postgres database and Pusher
 * app together: one "Test & save" checks both, and nothing is saved unless
 * both pass. Secrets are never shown again once saved. `onSaved` runs after
 * a successful save.
 */
export function ConnectionsForm({ onSaved, inSettings = false }: { onSaved?: () => void; inSettings?: boolean }) {
  const { connections, status, error, retry, saveConnections } = useConnections();
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  const [pasteNote, setPasteNote] = useState<string | null>(null);

  if (status === "error") return <ErrorState message={error ?? undefined} onRetry={retry} />;
  if (!connections) return <LoadingState />;

  const connectedBoth = !!connections.database && !!connections.pusher;
  const showForm = !connectedBoth || editing;
  const set = (field: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // Fills the Pusher fields from the snippet Pusher's App Keys "Copy" button
  // gives. The paste box is cleared right away so the secret doesn't stay on screen.
  const pasteSnippet = (text: string) => {
    if (!text.trim()) return;
    const found = parsePusherSnippet(text);
    const names = (Object.keys(found) as (keyof PusherFields)[]).map((f) => FIELD_NAMES[f]);
    setForm((f) => ({ ...f, ...found }));
    setPasteNote(
      names.length
        ? `Filled the Pusher ${listNames(names)}.${names.length < 4 ? " Fill in the rest below." : ""}`
        : "Couldn't find Pusher credentials in that text. Copy them from your app's App Keys page.",
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    saveConnections.mutate(
      {
        databaseUrl: form.databaseUrl.trim(),
        pusher: { appId: form.appId, key: form.key, secret: form.secret, cluster: form.cluster },
      },
      {
        onSuccess: () => {
          setForm(EMPTY);
          setPasteNote(null);
          setEditing(false);
          onSaved?.();
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      {!connections.canStoreCredentials && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
          The server can&apos;t store credentials yet (CREDENTIALS_KEY isn&apos;t set). Ask whoever runs this app to add it.
        </p>
      )}

      <div className="space-y-3">
        <Status
          icon={<Database size={18} weight="bold" className="text-brand-700" />}
          title="Database (PostgreSQL)"
          connected={connections.database ? `${connections.database.label}${checkedOn(connections.database.verifiedAt)}` : null}
        />
        <Status
          icon={<Lightning size={18} weight="bold" className="text-brand-700" />}
          title="Live updates (Pusher)"
          connected={
            connections.pusher
              ? `App ${connections.pusher.appId} · ${connections.pusher.cluster}${checkedOn(connections.pusher.verifiedAt)}`
              : null
          }
        />
      </div>

      {showForm ? (
        <form onSubmit={submit} className="space-y-5 border-t pt-5">
          <div className="space-y-1.5">
            <Label htmlFor="database-url">Database connection URL</Label>
            <Input
              id="database-url"
              type="text"
              {...SECRET_FIELD_PROPS}
              required
              value={form.databaseUrl}
              onChange={set("databaseUrl")}
              placeholder="postgresql://user:password@host:5432/database?sslmode=require"
              aria-describedby="database-help"
            />
            <p id="database-help" className="text-xs text-muted-foreground">
              Use an <strong>empty</strong> database; we create the tables. A pooled URL works best (Neon, Supabase and
              Prisma Postgres all offer one).
              {inSettings && connections.database && " Switching databases doesn't move your existing menu, orders or bookings."}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pusher-paste">Paste from Pusher</Label>
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
                In your Pusher Channels app, open <strong>App Keys</strong>, click <strong>Copy</strong> and paste here to fill
                the fields below. Or type them in yourself.
              </p>
              <p id="pusher-paste-note" aria-live="polite" className="text-xs font-medium text-brand-700">
                {pasteNote}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["appId", "Pusher app ID", "1234567"],
                  ["cluster", "Pusher cluster", "eu"],
                  ["key", "Pusher key", ""],
                  ["secret", "Pusher secret", ""],
                ] as const
              ).map(([field, label, placeholder]) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={`pusher-${field}`}>{label}</Label>
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

          {saveConnections.error && (
            <p role="alert" className="text-sm text-destructive">
              {saveConnections.error.message}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" loading={saveConnections.isPending} disabled={!connections.canStoreCredentials}>
              {saveConnections.isPending ? "Checking…" : "Test & save"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Both are checked before anything is saved. Passwords and secrets are stored encrypted and never shown again.
          </p>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setEditing(true)}>
          Replace connections
        </Button>
      )}
    </div>
  );
}
