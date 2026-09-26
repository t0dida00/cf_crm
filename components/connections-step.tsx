"use client";

import { ArrowLeft, SquaresFour } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  ConnectionsForm,
  connectionsReady,
} from "@/components/connections-form";
import { useConnections } from "@/hooks/use-connections";

/**
 * Onboarding step 2: connect the business's own database and Pusher app. When
 * the operator allows the shared service, the owner can skip and connect later
 * in Settings; otherwise both must be connected to continue.
 */
export function ConnectionsStep({ onContinue, onBack }: { onContinue: () => void; onBack?: () => void }) {
  const { connections } = useConnections();
  const ownBoth = !!connections?.database && !!connections.pusher;
  const canSkip = !!connections?.sharedInfraAllowed && !ownBoth;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500 text-white">
            <SquaresFour size={15} weight="bold" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">
            WORKSPACE SETUP · STEP 2 OF 2
          </span>
        </div>

        <div className="rounded-xl border bg-card p-10">
          <h1 className="text-2xl font-bold">Connect your own services</h1>
          <p className="mt-2 mb-8 text-sm text-muted-foreground text-pretty">
            Your menu, orders and bookings are stored in your own PostgreSQL
            database, and live updates go through your own Pusher app.{" "}
            {connections?.sharedInfraAllowed
              ? "You can also start on the shared service and connect these later in Settings."
              : "Connect both to continue."}
          </p>

          <ConnectionsForm />

          <div className="mt-8 flex gap-2 border-t pt-5">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft size={14} weight="bold" />
                Back
              </Button>
            )}
            <span className="flex-1" />
            {canSkip && (
              <Button variant="outline" onClick={onContinue}>
                Use the shared service for now
              </Button>
            )}
            {!canSkip && (
              <Button
                onClick={onContinue}
                disabled={!connectionsReady(connections)}
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
