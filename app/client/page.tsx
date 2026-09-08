"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientShell } from "@/components/client-shell";
import { useWorkspace } from "@/components/workspace-provider";
import {
  ClientWorkspaceProvider,
  useClientWorkspace,
} from "@/components/client-workspace-provider";
import { apiFetch } from "@/lib/api";
import type { TableRequestType } from "@/lib/types";

function GuestClientPage({ platformId, tableParam }: { platformId: string; tableParam: string | null }) {
  const { workspace, hydrated, fmt, createTableRequest } = useClientWorkspace();

  if (!hydrated) return null;

  const tableName =
    workspace.tables.find((t) => t.name === tableParam)?.name ??
    workspace.tables[0]?.name ??
    "Table 1";

  return (
    <ClientShell
      tableName={tableName}
      workspaceName={workspace.name}
      categories={workspace.categories}
      dishes={workspace.dishes}
      taxRate={workspace.taxRate}
      fmt={fmt}
      orders={[]}
      placeOrder={null}
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

function ClientPageInner() {
  const searchParams = useSearchParams();
  const platformId = searchParams.get("platform");
  const tableParam = searchParams.get("table");

  if (platformId) {
    return (
      <ClientWorkspaceProvider platformId={platformId}>
        <GuestClientPage platformId={platformId} tableParam={tableParam} />
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
