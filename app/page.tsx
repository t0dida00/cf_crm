"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SetupScreen } from "@/components/setup-screen";
import { BuildingScreen } from "@/components/building-screen";
import { useWorkspace } from "@/components/workspace-provider";

export default function Page() {
  const router = useRouter();
  const { create } = useWorkspace();
  const [building, setBuilding] = useState(false);

  if (building) {
    return <BuildingScreen onDone={() => router.push("/admin")} />;
  }

  return (
    <SetupScreen
      onSubmit={(name, domain) => {
        create(name, domain);
        setBuilding(true);
      }}
    />
  );
}
