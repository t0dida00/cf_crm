"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientShell } from "@/components/client/ClientShell";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { ErrorState, LoadingState } from "@/components/common/RequestState";
import { useQuery } from "@tanstack/react-query";
import { errorMessage } from "@/lib/requestStatus";
import { fetchJson } from "@/lib/http";
import {
  ClientWorkspaceProvider,
  useClientWorkspace,
} from "@/components/providers/ClientWorkspaceProvider";
import { usePlatformSocket } from "@/hooks/usePlatformSocket";
import { apiFetch } from "@/lib/api";
import type { TableRequestType } from "@/lib/types";
import { eventIsForTable } from "@/lib/tableEvents";
import { useTranslation } from "react-i18next";

function GuestClientPage({
  platformId,
  fixedTableName,
}: {
  platformId: string;
  fixedTableName: string;
}) {
  const {
    workspace,
    hydrated,
    status,
    error,
    reload,
    fmt,
    tableOrders,
    refreshTableOrders,
    placeOrder,
    createTableRequest,
  } = useClientWorkspace();
  const { t } = useTranslation();

  const tableName =
    workspace.tables.find((table) => table.name === fixedTableName)?.name ??
    workspace.tables[0]?.name ??
    fixedTableName;

  useEffect(() => {
    if (status === "success") refreshTableOrders(tableName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, tableName]);

  const channel = usePlatformSocket(hydrated ? platformId : null, workspace.pusher);

  useEffect(() => {
    if (!channel) return;
    // A staff-side checkout closes this table's orders (clearing them from
    // history) and a new order round can be placed by another device at the
    // same table — refetch this table's history on either so the guest sees
    // it live instead of needing to reload.
    // The channel is the whole restaurant's: only this table's events refetch.
    const refresh = (payload: unknown) => {
      if (eventIsForTable(payload, tableName)) refreshTableOrders(tableName);
    };
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

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <ErrorState message={error ?? t("client.loadFailed")} onRetry={reload} />
      </div>
    );
  }
  if (status !== "success") return <LoadingState label={t("client.loading")} className="min-h-screen" />;

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
  const { workspace, status, error, reload, fmt, placeOrder } = useWorkspace();
  const { t } = useTranslation();

  useEffect(() => {
    if ((status === "success" || status === "idle") && !workspace.name) router.replace("/");
  }, [status, workspace.name, router]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <ErrorState message={error ?? t("errors.workspaceLoad")} onRetry={reload} />
      </div>
    );
  }
  if (status !== "success" || !workspace.name) {
    return <LoadingState label={t("common.loading")} className="min-h-screen" />;
  }

  const tableName =
    workspace.tables.find((table) => table.name === tableParam)?.name ??
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
  const { t } = useTranslation();
  const tokenQuery = useQuery({
    queryKey: ["public", "token", token],
    queryFn: async ({ signal }): Promise<ResolvedToken> => {
      const data = await fetchJson<{ platformId: string; tableName: string }>(
        `/api/token-resolve/${encodeURIComponent(token)}`,
        { signal },
      );
      return { platformId: data.platformId, tableName: data.tableName };
    },
    staleTime: Infinity,
    retry: false,
  });
  const resolved = tokenQuery.data;

  if (tokenQuery.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <ErrorState
          message={errorMessage(tokenQuery.error, t("client.invalidQr"))}
          onRetry={() => void tokenQuery.refetch()}
        />
      </div>
    );
  }

  if (!resolved) return <LoadingState label={t("client.opening")} className="min-h-screen" />;

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
