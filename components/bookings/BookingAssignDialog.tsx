"use client";

import { useTranslation } from "react-i18next";
import { hasZone } from "@/lib/zone";
import { ArrowRight, SquaresFour } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import type { Booking } from "@/lib/types";

/** Assigns a free table to a booking (the table is marked Booked), or releases it. */
export function BookingAssignDialog({ booking, onClose }: { booking: Booking | null; onClose: () => void }) {
  const { t } = useTranslation();
  const { workspace, assignBooking, unassignBooking } = useWorkspace();
  const { run, isPending } = useAsyncAction();
  const freeTables = workspace.tables.filter((table) => table.state === "Free");

  return (
    <Dialog open={!!booking} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{booking ? t("bookings.assignTitle", { name: booking.name, time: booking.time }) : ""}</DialogTitle>
        </DialogHeader>
        {booking && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Assign a free table for {booking.party} guests. The table is marked Booked.
            </p>
            <div className="space-y-2">
              {freeTables.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("bookings.noFreeTables")}</p>
              ) : (
                freeTables.map((table) => (
                  <button
                    key={table.id}
                    type="button"
                    disabled={isPending(`assign-${booking.id}`)}
                    onClick={async () => {
                      const ok = await run(
                        `assign-${booking.id}`,
                        () => assignBooking(booking.id, table.id),
                        t("bookings.assignFailed"),
                      );
                      if (ok) onClose();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors hover:border-brand-500 hover:bg-brand-50 disabled:pointer-events-none disabled:opacity-50"
                  >
                    <SquaresFour size={17} weight="bold" className="text-brand-500" />
                    <span className="flex-1">
                      <span className="block text-[15px] font-semibold">{table.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t("bookings.seats", { n: table.seats })}{hasZone(table.zone) ? `, ${table.zone}` : ""}
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
                      t("bookings.releaseFailed"),
                    );
                    if (ok) onClose();
                  }}
                >
                  {t("bookings.release")}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
