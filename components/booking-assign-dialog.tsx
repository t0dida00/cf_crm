"use client";

import { ArrowRight, SquaresFour } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkspace } from "@/components/workspace-provider";
import { useAsyncAction } from "@/hooks/use-async-action";
import type { Booking } from "@/lib/types";

/** Assigns a free table to a booking (the table is marked Booked), or releases it. */
export function BookingAssignDialog({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const { workspace, assignBooking, unassignBooking } = useWorkspace();
  const { run, isPending } = useAsyncAction();
  const freeTables = workspace.tables.filter((t) => t.state === "Free");

  return (
    <Dialog open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{booking ? `${booking.name} · ${booking.time}` : ""}</DialogTitle>
        </DialogHeader>
        {booking && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Assign a free table for {booking.party} guests. The table is marked Booked.
            </p>
            <div className="space-y-2">
              {freeTables.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No free tables right now.</p>
              ) : (
                freeTables.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={isPending(`assign-${booking.id}`)}
                    onClick={async () => {
                      const ok = await run(
                        `assign-${booking.id}`,
                        () => assignBooking(booking.id, t.id),
                        "Failed to assign table.",
                      );
                      if (ok) onClose();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors hover:border-brand-500 hover:bg-brand-50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <SquaresFour size={17} weight="bold" className="text-brand-500" />
                    <span className="flex-1">
                      <span className="block text-[15px] font-semibold">{t.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t.seats} seats{t.zone ? ` · ${t.zone}` : ""}
                      </span>
                    </span>
                    <ArrowRight size={14} weight="bold" className="text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
            {booking.tableName && (
              <div className="border-t pt-3.5">
                <Button
                  variant="ghost"
                  loading={isPending(`unassign-${booking.id}`)}
                  onClick={async () => {
                    const ok = await run(
                      `unassign-${booking.id}`,
                      () => unassignBooking(booking.id),
                      "Failed to release table.",
                    );
                    if (ok) onClose();
                  }}
                >
                  Release table
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
