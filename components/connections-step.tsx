"use client";

import { ArrowLeft, ArrowRight, SignOut, SquaresFour } from "@phosphor-icons/react";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  connectedAll,
  ConnectionsForm,
  connectionsReady,
} from "@/components/connections-form";
import { useConnections, type ConnectionsInput } from "@/hooks/use-connections";

/**
 * Onboarding step 1: connect the business's own database, Pusher app and image
 * storage. When the operator allows the shared service, the owner can skip and
 * connect later in Settings; otherwise all three must be connected to continue.
 *
 * Before the business exists, pass `onChecked`: the form only checks the
 * services and hands them over, to be saved once step 2 creates the business.
 * `checked` is what was checked earlier (coming back from step 2), which fills
 * the form and can be continued with as is. Without `onChecked` (the business
 * exists, e.g. /admin when its database isn't connected), the form saves.
 */
export function ConnectionsStep({
  onContinue,
  onSkip = onContinue,
  onBack,
  onChecked,
  checked = null,
  error = null,
}: {
  onContinue: () => void;
  /** "Use the shared service for now"; defaults to onContinue. */
  onSkip?: () => void;
  onBack?: () => void;
  onChecked?: (input: ConnectionsInput) => void;
  checked?: ConnectionsInput | null;
  /** Why saving the checked connections failed after the business was created. */
  error?: string | null;
}) {
  const { connections } = useConnections();
  const canSkip = !!connections?.sharedInfraAllowed && !connectedAll(connections);
  // Before the business exists, "Test & continue" moves on by itself; the
  // button is only for continuing with what was already checked.
  const showContinue = onChecked ? !!checked : !canSkip;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-500 text-white">
            <SquaresFour size={15} weight="bold" />
          </span>
          <span className="text-xs font-semibold tracking-wide text-muted-foreground">
            WORKSPACE SETUP · STEP 1 OF 2
          </span>
          <span className="flex-1" />
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <SignOut size={14} weight="bold" />
              Sign out
            </button>
          </form>
        </div>

        <div className="rounded-xl border bg-card p-10">
          <h1 className="text-2xl font-bold">Connect your own services</h1>
          <p className="mt-2 mb-8 text-sm text-muted-foreground text-pretty">
            Your menu, orders and bookings are stored in your own PostgreSQL
            database, live updates go through your own Pusher app, and dish
            photos are kept in your own storage.{" "}
            {connections?.sharedInfraAllowed
              ? "You can also start on the shared service and connect these later in Settings."
              : "Connect all three to continue."}
          </p>

          {error && (
            <p role="alert" className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
              {error}
            </p>
          )}

          <ConnectionsForm onChecked={onChecked} initial={checked} />

          <div className="mt-8 flex gap-2 border-t pt-5">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft size={14} weight="bold" />
                Back
              </Button>
            )}
            <span className="flex-1" />
            {canSkip && (
              <Button variant="outline" onClick={onSkip}>
                Use the shared service for now
              </Button>
            )}
            {showContinue && (
              <Button onClick={onContinue} disabled={!checked && !connectionsReady(connections)}>
                Continue
                <ArrowRight size={14} weight="bold" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
