"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPlatformAction, updatePlatformAction } from "@/app/actions";
import { SetupScreen, type SetupDetails } from "@/components/setup-screen";
import { BuildingScreen } from "@/components/building-screen";
import { ConnectionsStep } from "@/components/connections-step";
import { LoadingState } from "@/components/request-state";
import { useWorkspace } from "@/components/workspace-provider";
import { useConnections, type ConnectionsInput } from "@/hooks/use-connections";
import { uploadImage } from "@/lib/upload-image";

type Step = "connections" | "details" | "building" | "opening";

const message = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

/**
 * Onboarding: step 1 checks the business's own services (nothing is saved:
 * the business doesn't exist yet), step 2 creates the business, then saves
 * the checked services and uploads the logo to them.
 */
export function WorkspaceSetupFlow() {
  const router = useRouter();
  const { workspace, hydrated, reload } = useWorkspace();
  const { saveConnections } = useConnections();
  const [step, setStep] = useState<Step>("connections");
  // Checked in step 1, saved once step 2 has created the business. Null = shared service.
  const [checked, setChecked] = useState<ConnectionsInput | null>(null);
  // What step 2 saved; set once the business exists, so going back edits it instead of creating another.
  const [created, setCreated] = useState<SetupDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectionsError, setConnectionsError] = useState<string | null>(null);

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
    return (
      <ConnectionsStep
        // Once the business exists (saving failed after step 2), the form saves directly.
        onChecked={
          created
            ? undefined
            : (input) => {
                setChecked(input);
                setConnectionsError(null);
                setStep("details");
              }
        }
        checked={checked}
        error={connectionsError}
        onContinue={() => {
          // Once the business exists, the form saved the connections itself.
          if (created) setChecked(null);
          setStep("details");
        }}
        onSkip={() => {
          setChecked(null);
          setStep("details");
        }}
      />
    );
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
      onBack={() => setStep("connections")}
      onSubmit={async (name, domain, { logoFile, ...contact }) => {
        setError(null);
        let details: SetupDetails = { name, domain, ...contact };
        try {
          if (created) await updatePlatformAction(details);
          else await createPlatformAction(details);
          setCreated(details);
        } catch (err) {
          setError(message(err, "Failed to create workspace"));
          return;
        }

        if (checked) {
          try {
            await saveConnections.mutateAsync(checked);
            setChecked(null);
          } catch (err) {
            // The business exists now; step 1 saves directly, filled in with what was checked.
            setConnectionsError(
              `Your business was created, but connecting your services failed: ${message(err, "unknown error")} Check them and try again.`,
            );
            setStep("connections");
            return;
          }
        }

        // Uploaded only now, so it goes to the storage just connected.
        if (logoFile) {
          try {
            details = { ...details, logoUrl: await uploadImage(logoFile) };
            await updatePlatformAction(details);
            setCreated(details);
          } catch (err) {
            toast.error(`Couldn't upload your logo (${message(err, "unknown error")}). You can add it later in Settings.`);
          }
        }
        setStep("building");
      }}
    />
  );
}
