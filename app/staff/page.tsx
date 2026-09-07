"use client";

import { useEffect } from "react";
import { StaffShell } from "@/components/staff-shell";
import { useWorkspace } from "@/components/workspace-provider";

export default function StaffPage() {
  const { workspace, create } = useWorkspace();

  useEffect(() => {
    if (!workspace.name) create("Casa Marina", "restaurant");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.name]);

  if (!workspace.name) return null;

  return <StaffShell />;
}
