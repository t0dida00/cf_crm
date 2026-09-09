"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { BuildingScreen } from "@/components/building-screen";
import { useWorkspace } from "@/components/workspace-provider";

export default function StaffPage() {
  const router = useRouter();
  const { workspace, hydrated } = useWorkspace();
  const [showBuilding, setShowBuilding] = useState(true);

  useEffect(() => {
    if (hydrated && !workspace.name) router.replace("/");
  }, [hydrated, workspace.name, router]);

  if (!hydrated || !workspace.name) return null;

  if (showBuilding) {
    return (
      <BuildingScreen
        name={workspace.name}
        domain={workspace.domain}
        onDone={() => setShowBuilding(false)}
      />
    );
  }

  return (
    <Suspense fallback={null}>
      <StaffShell />
    </Suspense>
  );
}
