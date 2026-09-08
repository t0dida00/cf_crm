"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { useWorkspace } from "@/components/workspace-provider";

export default function StaffPage() {
  const router = useRouter();
  const { workspace, hydrated } = useWorkspace();

  useEffect(() => {
    if (hydrated && !workspace.name) router.replace("/");
  }, [hydrated, workspace.name, router]);

  if (!hydrated || !workspace.name) return null;

  return <StaffShell />;
}
