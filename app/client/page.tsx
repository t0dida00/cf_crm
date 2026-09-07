"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ClientShell } from "@/components/client-shell";
import { useWorkspace } from "@/components/workspace-provider";

function ClientPageInner() {
  const { workspace, create } = useWorkspace();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!workspace.name) create("Casa Marina", "restaurant");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.name]);

  if (!workspace.name) return null;

  const requested = searchParams.get("table");
  const tableName =
    workspace.tables.find((t) => t.name === requested)?.name ??
    workspace.tables[0]?.name ??
    "Table 1";

  return <ClientShell tableName={tableName} />;
}

export default function ClientPage() {
  return (
    <Suspense fallback={null}>
      <ClientPageInner />
    </Suspense>
  );
}
