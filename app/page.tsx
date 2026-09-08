"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPlatformAction } from "@/app/actions";
import { SetupScreen } from "@/components/setup-screen";
import { BuildingScreen } from "@/components/building-screen";
import { useWorkspace } from "@/components/workspace-provider";
import type { Domain } from "@/lib/types";

export default function Page() {
  const router = useRouter();
  const { workspace, hydrated } = useWorkspace();
  const [building, setBuilding] = useState<{ name: string; domain: Domain } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && workspace.name) router.replace("/admin");
  }, [hydrated, workspace.name, router]);

  if (!hydrated || workspace.name) return null;

  if (building) {
    return (
      <BuildingScreen
        name={building.name}
        domain={building.domain}
        onDone={() => {
          router.refresh();
          router.push("/admin");
        }}
      />
    );
  }

  return (
    <SetupScreen
      error={error}
      onSubmit={async (name, domain, contact) => {
        setError(null);
        try {
          await createPlatformAction({ name, domain, ...contact });
          setBuilding({ name, domain });
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to create workspace");
        }
      }}
    />
  );
}
