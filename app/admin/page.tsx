"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { useWorkspace } from "@/components/workspace-provider";

export default function AdminPage() {
  const router = useRouter();
  const { workspace, hydrated } = useWorkspace();

  useEffect(() => {
    if (hydrated && !workspace.name) router.replace("/");
  }, [hydrated, workspace.name, router]);

  if (!hydrated || !workspace.name) return null;

  return <AdminShell />;
}
