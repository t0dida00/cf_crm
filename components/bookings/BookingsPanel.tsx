"use client";

import { useEffect, useMemo, useState } from "react";
import { CaretLeft, CaretRight, Trash } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RequiredLabel } from "@/components/common/RequiredLabel";
import { FieldError, fieldErrorProps } from "@/components/common/FieldError";
import { blockInvalidNumberKeys, validateBooking, type FieldErrors, withFieldError } from "@/lib/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { SAVED_MESSAGE, useAsyncAction } from "@/hooks/useAsyncAction";
import { PaginationBar } from "@/components/common/PaginationBar";
import { BookingAssignDialog } from "./BookingAssignDialog";
import {
  availableTimes,
  dayKey,
  monthGrid,
  parseDayKey,
  pastBookings,
  summariseDays,
} from "@/lib/bookingSlots";
import { TONE_CLASSES } from "@/lib/tone";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HISTORY_PAGE_SIZE = 10;

/** The preferred start time if it's still bookable on `date`, else the first one that is. */
const pickTime = (date: string, preferred = "19:00") => {
  const times = availableTimes(date);
  return times.includes(preferred) ? preferred : (times[0] ?? "");
};

export function BookingsPanel({
  createSignal,
  allowTableAssign = false,
}: {
  createSignal: number;
  /** Staff seat bookings: adds an action to assign (or release) a free table. */
  allowTableAssign?: boolean;
}) {
  const { workspace, saveBooking, toggleBooking, deleteBooking } = useWorkspace();
  const { run, isPending } = useAsyncAction();
  const todayKey = dayKey(new Date());
  const [selected, setSelected] = useState(todayKey);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [assignId, setAssignId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors<"name" | "party">>({});
  const [form, setForm] = useState({
    name: "",
    date: todayKey,
    time: "19:00",
    party: "2",
    tableName: "",
  });

  useEffect(() => {
    if (createSignal > 0) {
      // Bookings can't be made for past days: fall back to today.
      const date = selected < todayKey ? todayKey : selected;
      setForm({
        name: "",
        date,
        time: pickTime(date),
        party: "2",
        tableName: workspace.tables[0]?.name ?? "",
      });
      setErrors({});
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSignal]);

  const days = useMemo(() => summariseDays(workspace.bookings), [workspace.bookings]);
  const weeks = useMemo(() => monthGrid(month.year, month.month), [month]);
  const dayBookings = workspace.bookings
    .filter((b) => b.date === selected)
    .sort((a, b) => a.time.localeCompare(b.time));
  const summary = days.get(selected);
  const history = useMemo(() => pastBookings(workspace.bookings), [workspace.bookings]);
  const historyRows = history.slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE);
  const formTimes = availableTimes(form.date);

  const selectedDate = parseDayKey(selected);
  const shiftMonth = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const d = new Date(year, m + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  const selectDay = (d: Date) => {
    setSelected(dayKey(d));
    if (d.getMonth() !== month.month || d.getFullYear() !== month.year) {
      setMonth({ year: d.getFullYear(), month: d.getMonth() });
    }
  };

  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(300px,380px)_1fr]">
        <Card>
          <CardContent>
            <div className="mb-3 flex items-center gap-2">
              <p className="flex-1 text-base font-semibold">
                {new Date(month.year, month.month, 1).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectDay(new Date())}
                disabled={selected === todayKey}
              >
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                <CaretLeft size={14} weight="bold" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="Next month">
                <CaretRight size={14} weight="bold" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((d) => (
                <span key={d} className="py-1 text-xs font-semibold text-muted-foreground">
                  {d}
                </span>
              ))}
              {weeks.flat().map((d) => {
                const key = dayKey(d);
                const info = days.get(key);
                const inMonth = d.getMonth() === month.month;
                const isSelected = key === selected;
                const isToday = key === todayKey;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectDay(d)}
                    aria-pressed={isSelected}
                    aria-label={`${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}${
                      info ? `, ${info.bookings} booking${info.bookings === 1 ? "" : "s"}` : ", no bookings"
                    }`}
                    className={cn(
                      "flex h-14 flex-col items-center justify-start gap-0.5 rounded-lg border pt-1.5 text-sm transition-colors",
                      // Days with bookings are light brand tiles (brand-800 on brand-50 is
                      // 6.9:1); the selected day gets a thicker brand border.
                      info
                        ? "border-brand-600/50 bg-brand-50 font-bold text-brand-800 hover:bg-brand-100"
                        : isSelected
                          ? "bg-brand-50 font-bold text-brand-700"
                          : "border-transparent hover:bg-secondary",
                      isSelected && "border-2 border-brand-700",
                      !info && !inMonth && !isSelected && "text-muted-foreground",
                      isToday && !info && !isSelected && "border-brand-500 font-bold",
                    )}
                  >
                    {d.getDate()}
                    {info && (
                      <span
                        className="rounded-full bg-brand-700 px-1.5 text-[11px] leading-4 font-semibold text-white"
                      >
                        {info.bookings}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Tinted days have bookings; the number shows how many.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-lg font-semibold">
                {selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="text-sm text-muted-foreground">
                {summary
                  ? `${summary.bookings} booking${summary.bookings === 1 ? "" : "s"}, ${summary.guests} guests`
                  : "No bookings"}
              </p>
            </div>
            {dayBookings.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No reservations on this day.</p>
            ) : (
              dayBookings.map((booking) => (
                <div
                  key={booking.id}
                  className={cn(
                    "-mx-6 flex items-center gap-4 border-t px-6 py-3.5",
                    booking.status === "Arrived" && ARRIVED_ROW,
                  )}
                >
                  <span className="w-14 text-base font-bold">{booking.time}</span>
                  <div className="flex-1">
                    <p className="text-[15px]">{booking.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {partyLine(booking)}
                    </p>
                  </div>
                  <Badge className={booking.status === "Arrived" ? ARRIVED_BADGE : TONE_CLASSES.sky}>
                    {booking.status}
                  </Badge>
                  {allowTableAssign && (
                    <button
                      type="button"
                      onClick={() => setAssignId(booking.id)}
                      className="text-[13px] font-semibold text-brand-700 hover:text-brand-800"
                    >
                      {booking.tableName ? "Change table" : "Assign table"}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={isPending(`toggle-${booking.id}`)}
                    onClick={() =>
                      run(`toggle-${booking.id}`, () => toggleBooking(booking.id), "Failed to update booking.")
                    }
                    className="text-[13px] font-semibold text-brand-700 hover:text-brand-800 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {booking.status === "Arrived" ? "Undo arrival" : "Mark arrived"}
                  </button>
                  <button
                    type="button"
                    disabled={isPending(`delete-${booking.id}`)}
                    onClick={() =>
                      run(`delete-${booking.id}`, () => deleteBooking(booking.id), "Failed to delete booking.")
                    }
                    className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                    aria-label={`Delete booking for ${booking.name} at ${booking.time}`}
                  >
                    <Trash size={15} weight="bold" />
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden">
        <CardContent className="px-0">
          <div className="flex items-baseline gap-3 px-6 pb-3">
            <h2 className="font-semibold">Past bookings</h2>
            <p className="text-sm text-muted-foreground">{history.length} {history.length === 1 ? "booking" : "bookings"}, newest first</p>
          </div>
          {history.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No past bookings yet.</p>
          ) : (
            <>
              {historyRows.map((booking) => (
                <button
                  key={booking.id}
                  type="button"
                  onClick={() => selectDay(parseDayKey(booking.date))}
                  className={cn(
                    "flex w-full items-center gap-4 border-t px-6 py-3 text-left transition-colors",
                    booking.status === "Arrived" ? `${ARRIVED_ROW} hover:bg-green-100` : "hover:bg-secondary",
                  )}
                >
                  <span className="w-36 shrink-0 text-sm font-semibold">
                    {parseDayKey(booking.date).toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="w-12 shrink-0 text-sm font-bold">{booking.time}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px]">{booking.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {partyLine(booking)}
                    </span>
                  </span>
                  <Badge className={booking.status === "Arrived" ? ARRIVED_BADGE : TONE_CLASSES.gray}>
                    {booking.status}
                  </Badge>
                </button>
              ))}
              <PaginationBar
                page={historyPage}
                pageSize={HISTORY_PAGE_SIZE}
                total={history.length}
                onPageChange={setHistoryPage}
                noun="bookings"
              />
            </>
          )}
        </CardContent>
      </Card>

      {allowTableAssign && (
        <BookingAssignDialog
          booking={workspace.bookings.find((b) => b.id === assignId) ?? null}
          onClose={() => setAssignId(null)}
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="booking-name">Guest name</RequiredLabel>
              <Input
                id="booking-name"
                required
                value={form.name}
                placeholder="Name on the booking"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                {...fieldErrorProps("booking-name", errors.name)}
                onBlur={() => setErrors((e) => withFieldError(e, "name", validateBooking(form).name))}
              />
              <FieldError id="booking-name" message={errors.name} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <RequiredLabel htmlFor="booking-date">Date</RequiredLabel>
                <Input
                  id="booking-date"
                required
                  type="date"
                  value={form.date}
                  min={todayKey}
                  onChange={(e) => {
                    const date = e.target.value;
                    if (!date || date < todayKey) return;
                    setForm((f) => ({
                      ...f,
                      date,
                      time: availableTimes(date).includes(f.time) ? f.time : pickTime(date),
                    }));
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <RequiredLabel htmlFor="booking-time">Time</RequiredLabel>
                <Select
                  value={form.time}
                  onValueChange={(time) => setForm((f) => ({ ...f, time }))}
                  disabled={formTimes.length === 0}
                >
                  <SelectTrigger id="booking-time" className="w-full">
                    <SelectValue placeholder="No times left" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {formTimes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {formTimes.length === 0 && (
              <p className="-mt-2 text-xs text-destructive">No start times left today — pick a later date.</p>
            )}
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="booking-party">Party size</RequiredLabel>
              <Input
                id="booking-party"
                required
                type="number"
                min={1}
                step={1}
                value={form.party}
                onKeyDown={blockInvalidNumberKeys({ whole: true })}
                onChange={(e) => setForm((f) => ({ ...f, party: e.target.value }))}
                {...fieldErrorProps("booking-party", errors.party)}
                onBlur={() => setErrors((e) => withFieldError(e, "party", validateBooking(form).party))}
              />
              <FieldError id="booking-party" message={errors.party} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bookings-panel-table">Table</Label>
              <Select value={form.tableName} onValueChange={(tableName) => setForm((f) => ({ ...f, tableName }))}>
                <SelectTrigger id="bookings-panel-table" className="w-full">
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
              loading={isPending("create-booking")}
              disabled={!form.time || form.date < todayKey}
              onClick={async () => {
                const found = validateBooking(form);
                setErrors(found);
                if (Object.keys(found).length || !form.time || form.date < todayKey) return;
                const ok = await run("create-booking", () =>
                  saveBooking({
                    name: form.name.trim(),
                    date: form.date,
                    time: form.time,
                    party: Number(form.party),
                    tableName: form.tableName,
                    status: "Confirmed",
                  }), undefined, SAVED_MESSAGE
                );
                if (ok) {
                  setOpen(false);
                  selectDay(parseDayKey(form.date));
                }
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

/* An arrived party's whole row takes the "Arrived" green; its tag steps one
 * shade darker so it still stands out on the row. green-800 on green-100 is 6.8:1. */
const ARRIVED_ROW = "bg-green-50";
const ARRIVED_BADGE = "bg-green-100 text-green-800";

/** "4 guests at Table 2", or "4 guests, no table yet". */
export function partyLine(booking: { party: number; tableName: string | null }): string {
  const guests = `${booking.party} ${booking.party === 1 ? "guest" : "guests"}`;
  return booking.tableName ? `${guests} at ${booking.tableName}` : `${guests}, no table yet`;
}
