"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StaffShell } from "@/components/staff-shell";
import { BuildingScreen } from "@/components/building-screen";
import { useWorkspace } from "@/components/workspace-provider";

const BUILDING_SEEN_KEY = "tably:building-seen";

export default function StaffPage() {
  const router = useRouter();
  const { workspace, hydrated } = useWorkspace();
  const [showBuilding, setShowBuilding] = useState(
    () => typeof window !== "undefined" && !sessionStorage.getItem(BUILDING_SEEN_KEY),
  );

  useEffect(() => {
    if (hydrated && !workspace.name) router.replace("/");
  }, [hydrated, workspace.name, router]);

  if (!hydrated || !workspace.name) return null;

  if (showBuilding) {
    return (
      <BuildingScreen
        name={workspace.name}
        domain={workspace.domain}
        onDone={() => {
          sessionStorage.setItem(BUILDING_SEEN_KEY, "1");
          setShowBuilding(false);
        }}
      />
    );
  }

  return (
    <Suspense fallback={null}>
      <StaffShell />
    </Suspense>
  );
}
