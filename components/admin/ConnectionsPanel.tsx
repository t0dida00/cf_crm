"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { ConnectionsForm } from "@/components/onboarding/ConnectionsForm";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";

/** Settings tab: the business's own database, Pusher app and image storage (owner only, like the admin app). */
export function ConnectionsPanel() {
  const { refresh } = useWorkspace();
  return (
    <Card className="max-w-xl xl:max-w-none">
      <CardContent className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Connections</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your own database, live-update service and image storage. Only you, the owner, can see or change these.
          </p>
        </div>
        {/* Refresh in the background so data and live updates switch to the
            newly connected service without the page going blank. */}
        <ConnectionsForm inSettings onSaved={refresh} />
      </CardContent>
    </Card>
  );
}
