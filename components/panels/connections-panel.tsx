"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ConnectionsForm } from "@/components/connections-form";
import { useWorkspace } from "@/components/workspace-provider";

/** Settings tab: the business's own database and Pusher app (owner only, like the admin app). */
export function ConnectionsPanel() {
  const { refresh } = useWorkspace();
  return (
    <Card className="max-w-xl">
      <CardContent className="space-y-5">
        <div>
          <p className="text-lg font-semibold">Connections</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your own database and live-update service. Only you, the owner, can see or change these.
          </p>
        </div>
        {/* Refresh in the background so data and live updates switch to the
            newly connected service without the page going blank. */}
        <ConnectionsForm inSettings onSaved={refresh} />
      </CardContent>
    </Card>
  );
}
