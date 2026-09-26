"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle, Database, Lightning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState } from "@/components/request-state";
import { useConnections, type Connections } from "@/hooks/use-connections";

const EMPTY_PUSHER = { appId: "", key: "", secret: "", cluster: "" };

const verified = (at: string | null) =>
  at
    ? `checked ${new Date(at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    : "";

/** True once the business can run on its own infrastructure, or may use the shared one. */
export const connectionsReady = (c: Connections | null) =>
  !!c && (c.sharedInfraAllowed || (c.database !== null && c.pusher !== null));

function Section({
  icon,
  title,
  connected,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  connected: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 border-t pt-5 first:border-0 first:pt-0">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      {connected ? (
        <p className="flex items-center gap-1.5 text-sm text-green-700">
          <CheckCircle size={16} weight="fill" />
          {connected}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Not connected: using the shared service.
        </p>
      )}
      {children}
    </section>
  );
}

/**
 * Lets the owner connect their business's own Postgres database and Pusher
 * app. Each part is checked by the backend before it's saved; secrets are
 * never shown again once saved. `onSaved` runs after either one is saved.
 */
export function ConnectionsForm({
  onSaved,
  inSettings = false,
}: {
  onSaved?: () => void;
  inSettings?: boolean;
}) {
  const { connections, status, error, retry, saveDatabase, savePusher } =
    useConnections();
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [pusher, setPusher] = useState(EMPTY_PUSHER);
  const [editingDb, setEditingDb] = useState(false);
  const [editingPusher, setEditingPusher] = useState(false);

  if (status === "error")
    return <ErrorState message={error ?? undefined} onRetry={retry} />;
  if (!connections) return <LoadingState />;

  const showDbForm = !connections.database || editingDb;
  const showPusherForm = !connections.pusher || editingPusher;

  const submitDatabase = (e: FormEvent) => {
    e.preventDefault();
    saveDatabase.mutate(databaseUrl.trim(), {
      onSuccess: () => {
        setDatabaseUrl("");
        setEditingDb(false);
        onSaved?.();
      },
    });
  };
  const submitPusher = (e: FormEvent) => {
    e.preventDefault();
    savePusher.mutate(pusher, {
      onSuccess: () => {
        setPusher(EMPTY_PUSHER);
        setEditingPusher(false);
        onSaved?.();
      },
    });
  };

  return (
    <div className="space-y-5">
      {!connections.canStoreCredentials && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
        >
          The server can&apos;t store credentials yet (CREDENTIALS_KEY
          isn&apos;t set). Ask whoever runs this app to add it.
        </p>
      )}

      <Section
        icon={<Database size={18} weight="bold" className="text-brand-700" />}
        title="Database (PostgreSQL)"
        connected={
          connections.database
            ? `${connections.database.label} · ${verified(connections.database.verifiedAt)}`
            : null
        }
      >
        {showDbForm ? (
          <form onSubmit={submitDatabase} className="space-y-2">
            <Label htmlFor="database-url">Connection URL</Label>
            <Input
              id="database-url"
              type="password"
              autoComplete="off"
              spellCheck={false}
              required
              value={databaseUrl}
              onChange={(e) => setDatabaseUrl(e.target.value)}
              placeholder="postgresql://user:password@host:5432/database?sslmode=require"
              aria-describedby="database-help"
            />
            <p id="database-help" className="text-xs text-muted-foreground">
              Use an <strong>empty</strong> database; we create the tables. A
              pooled URL works best (Neon, Supabase and Prisma Postgres all
              offer one).
              {inSettings &&
                connections.database &&
                " Switching databases doesn't move your existing menu, orders or bookings."}
            </p>
            {saveDatabase.error && (
              <p role="alert" className="text-sm text-destructive">
                {saveDatabase.error.message}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                loading={saveDatabase.isPending}
                disabled={!connections.canStoreCredentials}
              >
                {saveDatabase.isPending ? "Checking…" : "Test & save"}
              </Button>
              {editingDb && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingDb(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditingDb(true)}
          >
            Replace database
          </Button>
        )}
      </Section>

      <Section
        icon={<Lightning size={18} weight="bold" className="text-brand-700" />}
        title="Live updates (Pusher)"
        connected={
          connections.pusher
            ? `App ${connections.pusher.appId} · ${connections.pusher.cluster} · ${verified(connections.pusher.verifiedAt)}`
            : null
        }
      >
        {showPusherForm ? (
          <form onSubmit={submitPusher} className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Find these under your Pusher Channels app &rarr; App Keys.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["appId", "App ID", "text", "1234567"],
                  ["cluster", "Cluster", "text", "eu"],
                  ["key", "Key", "text", ""],
                  ["secret", "Secret", "password", ""],
                ] as const
              ).map(([field, label, type, placeholder]) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={`pusher-${field}`}>{label}</Label>
                  <Input
                    id={`pusher-${field}`}
                    type={type}
                    autoComplete="off"
                    spellCheck={false}
                    required
                    placeholder={placeholder}
                    value={pusher[field]}
                    onChange={(e) =>
                      setPusher((p) => ({ ...p, [field]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>
            {savePusher.error && (
              <p role="alert" className="text-sm text-destructive">
                {savePusher.error.message}
              </p>
            )}
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                loading={savePusher.isPending}
                disabled={!connections.canStoreCredentials}
              >
                {savePusher.isPending ? "Checking…" : "Test & save"}
              </Button>
              {editingPusher && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingPusher(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditingPusher(true)}
          >
            Replace Pusher app
          </Button>
        )}
      </Section>

      <p className="text-xs text-muted-foreground">
        Passwords and secrets are stored encrypted and never shown again.
      </p>
    </div>
  );
}
