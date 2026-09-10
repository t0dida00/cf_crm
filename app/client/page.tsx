"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientShell } from "@/components/client-shell";
import { useWorkspace } from "@/components/workspace-provider";
import {
  ClientWorkspaceProvider,
  useClientWorkspace,
} from "@/components/client-workspace-provider";
import { usePlatformSocket } from "@/hooks/use-platform-socket";
import { apiFetch } from "@/lib/api";
import type { TableRequestType } from "@/lib/types";

function GuestClientPage({
  platformId,
  fixedTableName,
}: {
  platformId: string;
  fixedTableName: string;
}) {
  const { workspace, hydrated, fmt, tableOrders, refreshTableOrders, placeOrder, createTableRequest } =
    useClientWorkspace();

  const tableName =
    workspace.tables.find((t) => t.name === fixedTableName)?.name ??
    workspace.tables[0]?.name ??
    fixedTableName;

  useEffect(() => {
    if (hydrated) refreshTableOrders(tableName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, tableName]);

  const channel = usePlatformSocket(hydrated ? platformId : null);

  useEffect(() => {
    if (!channel) return;
    // A staff-side checkout closes this table's orders (clearing them from
    // history) and a new order round can be placed by another device at the
    // same table — refetch this table's history on either so the guest sees
    // it live instead of needing to reload.
    const refresh = () => refreshTableOrders(tableName);
    channel.bind("order:created", refresh);
    channel.bind("order:updated", refresh);
    channel.bind("table:checked_out", refresh);
    return () => {
      channel.unbind("order:created", refresh);
      channel.unbind("order:updated", refresh);
      channel.unbind("table:checked_out", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, tableName]);

  if (!hydrated) return null;

  return (
    <ClientShell
      tableName={tableName}
      workspaceName={workspace.name}
      workspaceAddress={workspace.address}
      workspacePhone={workspace.phone}
      workspaceLogoUrl={workspace.logoUrl}
      categories={workspace.categories}
      dishes={workspace.dishes}
      taxRate={workspace.taxRate}
      fmt={fmt}
      orders={tableOrders}
      placeOrder={placeOrder}
      createTableRequest={createTableRequest}
    />
  );
}

function SessionClientPage({ tableParam }: { tableParam: string | null }) {
  const router = useRouter();
  const { workspace, hydrated, fmt, placeOrder } = useWorkspace();

  useEffect(() => {
    if (hydrated && !workspace.name) router.replace("/");
  }, [hydrated, workspace.name, router]);

  if (!hydrated || !workspace.name) return null;

  const tableName =
    workspace.tables.find((t) => t.name === tableParam)?.name ??
    workspace.tables[0]?.name ??
    "Table 1";

  return (
    <ClientShell
      tableName={tableName}
      workspaceName={workspace.name}
      workspaceAddress={workspace.address}
      workspacePhone={workspace.phone}
      workspaceLogoUrl={workspace.logoUrl}
      categories={workspace.categories}
      dishes={workspace.dishes}
      taxRate={workspace.settings.taxRate}
      fmt={fmt}
      orders={workspace.orders}
      placeOrder={placeOrder}
      createTableRequest={async ({ tableName, type }: { tableName: string; type: TableRequestType }) => {
        await apiFetch("/table-requests", {
          method: "POST",
          body: JSON.stringify({ tableName, type }),
        });
      }}
    />
  );
}

interface ResolvedToken {
  platformId: string;
  tableName: string;
}

function TokenClientPage({ token }: { token: string }) {
  const [resolved, setResolved] = useState<ResolvedToken | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/token-resolve/${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Invalid QR code");
        return res.json();
      })
      .then((data: { platformId: string; tableName: string }) => {
        if (!cancelled) setResolved({ platformId: data.platformId, tableName: data.tableName });
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Invalid QR code");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!resolved) return null;

  return (
    <ClientWorkspaceProvider platformId={resolved.platformId}>
      <GuestClientPage platformId={resolved.platformId} fixedTableName={resolved.tableName} />
    </ClientWorkspaceProvider>
  );
}

function ClientPageInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("t");
  const platformId = searchParams.get("platform");
  const tableParam = searchParams.get("table");

  if (token) {
    return <TokenClientPage token={token} />;
  }

  if (platformId) {
    return (
      <ClientWorkspaceProvider platformId={platformId}>
        <GuestClientPage platformId={platformId} fixedTableName={tableParam ?? "Table 1"} />
      </ClientWorkspaceProvider>
    );
  }

  return <SessionClientPage tableParam={tableParam} />;
}

export default function ClientPage() {
  return (
    <Suspense fallback={null}>
      <ClientPageInner />
    </Suspense>
  );
}
