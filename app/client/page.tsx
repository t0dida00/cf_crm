"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ClientShell } from "@/components/client-shell";
import { useWorkspace } from "@/components/workspace-provider";

function ClientPageInner() {
  const router = useRouter();
  const { workspace, hydrated } = useWorkspace();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (hydrated && !workspace.name) router.replace("/");
  }, [hydrated, workspace.name, router]);

  if (!hydrated || !workspace.name) return null;

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
