"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPlatformAction, updatePlatformAction } from "@/app/actions";
import { SetupScreen, type SetupDetails } from "@/components/setup-screen";
import { BuildingScreen } from "@/components/building-screen";
import { ConnectionsStep } from "@/components/connections-step";
import { LoadingState } from "@/components/request-state";
import { useWorkspace } from "@/components/workspace-provider";

type Step = "details" | "connections" | "building" | "opening";

export function WorkspaceSetupFlow() {
  const router = useRouter();
  const { workspace, hydrated, reload } = useWorkspace();
  const [step, setStep] = useState<Step>("details");
  // What step 1 saved; set once the business exists, so "Back" edits it instead of creating another.
  const [created, setCreated] = useState<SetupDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Once the workspace has a business (loaded, or reloaded after setup), open the admin app.
  useEffect(() => {
    if (hydrated && workspace.name) router.replace("/admin");
  }, [hydrated, workspace.name, router]);

  // The workspace was loaded before the business existed. Reload it only at the
  // end: reloading earlier would redirect to /admin and skip the remaining steps.
  if (step === "opening" || (hydrated && workspace.name)) {
    return <LoadingState label="Opening your workspace…" className="min-h-screen" />;
  }
  if (!hydrated) return null;

  if (step === "connections") {
    return <ConnectionsStep onContinue={() => setStep("building")} onBack={() => setStep("details")} />;
  }

  if (step === "building" && created) {
    return (
      <BuildingScreen
        name={created.name}
        domain={created.domain}
        onDone={() => {
          sessionStorage.setItem("tably:building-seen", "1");
          setStep("opening");
          reload();
        }}
      />
    );
  }

  return (
    <SetupScreen
      error={error}
      initial={created}
      onSubmit={async (name, domain, contact) => {
        setError(null);
        try {
          const details = { name, domain, ...contact };
          if (created) await updatePlatformAction(details);
          else await createPlatformAction(details);
          setCreated(details);
          setStep("connections");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to create workspace");
        }
      }}
    />
  );
}
