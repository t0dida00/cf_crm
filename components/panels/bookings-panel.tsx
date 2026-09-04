"use client";

import { useEffect, useState } from "react";
import { Trash } from "@phosphor-icons/react";
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

export function BookingsPanel({ createSignal }: { createSignal: number }) {
  const { workspace, saveBooking, toggleBooking, deleteBooking } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    time: "19:00",
    party: "2",
    tableName: "",
  });

  useEffect(() => {
    if (createSignal > 0) {
      setForm({
        name: "",
        time: "19:00",
        party: "2",
        tableName: workspace.tables[0]?.name ?? "",
      });
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSignal]);

  const startOfToday = new Date().setHours(0, 0, 0, 0);
  const today = workspace.bookings
    .filter((b) => b.ts >= startOfToday)
    .sort((a, b) => a.time.localeCompare(b.time));

  const seatTotal = workspace.tables.reduce((a, t) => a + t.seats, 0) || 1;

  return (
    <>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] items-start">
        <Card>
          <CardContent>
            <p className="mb-2 text-lg font-semibold">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </p>
            {today.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No reservations today.
              </p>
            ) : (
              today.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 border-t py-3.5"
                >
                  <span className="w-14 text-base font-bold">{booking.time}</span>
                  <div className="flex-1">
                    <p className="text-[15px]">{booking.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.party} guests · {booking.tableName}
                    </p>
                  </div>
                  <Badge
                    className={
                      booking.status === "Arrived"
                        ? "bg-green-50 text-green-700"
                        : "bg-sky-50 text-sky-700"
                    }
                  >
                    {booking.status}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => toggleBooking(booking.id)}
                    className="text-[13px] font-semibold text-brand-500 hover:text-brand-600"
                  >
                    {booking.status === "Arrived" ? "Undo arrival" : "Mark arrived"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteBooking(booking.id)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Delete booking"
                  >
                    <Trash size={15} weight="bold" />
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground">
              CAPACITY BY SLOT
            </p>
            {SLOT_TIMES.map((time) => {
              const booked = today
                .filter((b) => b.time === time)
                .reduce((a, b) => a + b.party, 0);
              const pct = Math.min(100, Math.round((booked / seatTotal) * 100));
              return (
                <div key={time} className="py-2">
                  <div className="mb-1.5 flex justify-between text-[13px]">
                    <span>{time}</span>
                    <span className="text-muted-foreground">
                      {booked ? `${booked} / ${seatTotal} seats` : "free"}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={pct > 70 ? "h-full bg-amber-600" : "h-full bg-brand-500"}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="booking-name">Guest name</Label>
              <Input
                id="booking-name"
                value={form.name}
                placeholder="Name on the booking"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Select
                value={form.time}
                onValueChange={(time) => setForm((f) => ({ ...f, time }))}
              >
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
              <Label htmlFor="booking-party">Party size</Label>
              <Input
                id="booking-party"
                type="number"
                value={form.party}
                onChange={(e) => setForm((f) => ({ ...f, party: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Table</Label>
              <Select
                value={form.tableName}
                onValueChange={(tableName) => setForm((f) => ({ ...f, tableName }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workspace.tables.map((t) => (
                    <SelectItem key={t.id} value={t.name}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!form.name.trim()) return;
                saveBooking({
                  name: form.name.trim(),
                  time: form.time,
                  party: Number(form.party) || 2,
                  tableName: form.tableName,
                  status: "Confirmed",
                });
                setOpen(false);
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
