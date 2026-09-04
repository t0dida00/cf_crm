"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { useWorkspace } from "@/components/workspace-provider";

export default function AdminPage() {
  const router = useRouter();
  const { workspace } = useWorkspace();

  useEffect(() => {
    if (!workspace.name) router.replace("/");
  }, [workspace.name, router]);

  if (!workspace.name) return null;

  return <AdminShell onRestart={() => router.push("/")} />;
}
