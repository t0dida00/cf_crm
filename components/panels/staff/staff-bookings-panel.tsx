"use client";

import { useState } from "react";
import { ArrowRight, Plus, SquaresFour } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/components/workspace-provider";
import { SLOT_TIMES } from "@/lib/lexicon";
import { bookingTone } from "@/lib/tone";
import type { Booking } from "@/lib/types";

export function StaffBookingsPanel() {
  const { workspace, saveBooking, assignBooking, unassignBooking } = useWorkspace();
  const [assignId, setAssignId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", time: "19:00", party: "2" });

  const bookings = workspace.bookings.slice().sort((a, b) => a.time.localeCompare(b.time));
  const assigning: Booking | null = workspace.bookings.find((b) => b.id === assignId) ?? null;
  const freeTables = workspace.tables.filter((t) => t.state === "Free");

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setForm({ name: "", time: "19:00", party: "2" });
            setCreateOpen(true);
          }}
        >
          <Plus size={14} weight="bold" />
          New booking
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="overflow-x-auto px-0">
          <div className="min-w-[650px]">
            <div className="grid grid-cols-[90px_minmax(160px,1fr)_120px_150px_130px] items-center gap-3 border-b bg-secondary py-3 pr-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {/* Time is sticky so it stays on screen while scrolling right
                  to see Table/Status — otherwise the row you're looking at
                  scrolls off with nothing left to identify it by. Negative
                  margin + matching padding bleeds its background across the
                  row's own edge padding, so there's no visible seam between
                  the sticky column and the rest of the (scrolled-away) row. */}
              <span className="sticky left-0 -my-3 bg-secondary py-3 pl-5">Time</span>
              <span>Guest</span>
              <span>Party</span>
              <span>Table</span>
              <span>Status</span>
            </div>
            {bookings.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No upcoming bookings.
              </p>
            ) : (
              bookings.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setAssignId(b.id)}
                  className="group grid w-full grid-cols-[90px_minmax(160px,1fr)_120px_150px_130px] items-center gap-3 border-b py-3.5 pr-5 text-left transition-colors last:border-0 hover:bg-secondary"
                >
                  <span className="sticky left-0 -my-3.5 bg-card py-3.5 pl-5 text-[15px] font-bold group-hover:bg-secondary">
                    {b.time}
                  </span>
                  <span className="text-[15px]">{b.name}</span>
                  <span className="text-sm text-muted-foreground">{b.party} guests</span>
                  <span className="text-sm">{b.tableName ?? "Not assigned"}</span>
                  <span>
                    <Badge className={bookingTone(b.tableName ? "Arrived" : "Confirmed")}>
                      {b.tableName ? "Table assigned" : "Awaiting table"}
                    </Badge>
                  </span>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!assigning} onOpenChange={(o) => !o && setAssignId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{assigning ? `${assigning.name} · ${assigning.time}` : ""}</DialogTitle>
          </DialogHeader>
          {assigning && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Assign a free table for {assigning.party} guests. The table is marked Booked.
              </p>
              <div className="space-y-2">
                {freeTables.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No free tables right now.
                  </p>
                ) : (
                  freeTables.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        assignBooking(assigning.id, t.id);
                        setAssignId(null);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors hover:border-brand-500 hover:bg-brand-50"
                    >
                      <SquaresFour size={17} weight="bold" className="text-brand-500" />
                      <span className="flex-1">
                        <span className="block text-[15px] font-semibold">{t.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {t.seats} seats · {t.zone}
                        </span>
                      </span>
                      <ArrowRight size={14} weight="bold" className="text-muted-foreground" />
                    </button>
                  ))
                )}
              </div>
              {assigning.tableName && (
                <div className="border-t pt-3.5">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      unassignBooking(assigning.id);
                      setAssignId(null);
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="staff-booking-name">Guest name</Label>
              <Input
                id="staff-booking-name"
                value={form.name}
                placeholder="Name on the booking"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Select value={form.time} onValueChange={(time) => setForm((f) => ({ ...f, time }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_TIMES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-booking-party">Party size</Label>
              <Input
                id="staff-booking-party"
                type="number"
                value={form.party}
                onChange={(e) => setForm((f) => ({ ...f, party: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!form.name.trim()) return;
                saveBooking({
                  name: form.name.trim(),
                  time: form.time,
                  party: Number(form.party) || 2,
                  tableName: null,
                  status: "Confirmed",
                });
                setCreateOpen(false);
              }}
            >
              Add booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
