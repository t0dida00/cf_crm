"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StaffShell } from "@/components/layout/StaffShell";
import { BuildingScreen } from "@/components/onboarding/BuildingScreen";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { ErrorState, LoadingState } from "@/components/common/RequestState";
import { DATABASE_NOT_CONNECTED } from "@/lib/requestStatus";

const BUILDING_SEEN_KEY = "tably:building-seen";

export default function StaffPage() {
  const router = useRouter();
  const { workspace, status, error, reload } = useWorkspace();
  const [showBuilding, setShowBuilding] = useState(
    () => typeof window !== "undefined" && !sessionStorage.getItem(BUILDING_SEEN_KEY),
  );

  // Only a successful load with no workspace means "not set up yet" — a failed
  // load shows an error with a retry instead of bouncing the user away.
  useEffect(() => {
    if (status === "success" && !workspace.name) router.replace("/");
  }, [status, workspace.name, router]);

  if (status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <ErrorState
          message={
            error === DATABASE_NOT_CONNECTED
              ? "Your owner needs to connect the business's database before the app can be used."
              : (error ?? "Couldn't load your workspace.")
          }
          onRetry={reload}
        />
      </div>
    );
  }
  if (status !== "success" || !workspace.name) {
    return <LoadingState label="Loading workspace…" className="min-h-screen" />;
  }

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
