"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CheckCircle, Clock, Receipt } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkspace } from "@/components/workspace-provider";
import { hhmm } from "@/lib/range";
import { tableStateTone, orderTone } from "@/lib/tone";
import type { TableState } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATES: (TableState | "All")[] = ["All", "Free", "Booked", "Seated", "Finished"];

const STATE_ICON = { Seated: Clock, Booked: CalendarCheck, Finished: Receipt, Free: CheckCircle };

export function StaffTablesPanel() {
  const { workspace, flow, fmt, seatTable, checkoutTable, freeTable } = useWorkspace();
  const [stateFilter, setStateFilter] = useState<TableState | "All">("All");
  const [tableId, setTableId] = useState<string | null>(null);

  const tables = workspace.tables.filter(
    (t) => stateFilter === "All" || t.state === stateFilter,
  );
  const table = workspace.tables.find((t) => t.id === tableId) ?? null;

  const tableOrders = useMemo(
    () => (table ? workspace.orders.filter((o) => o.tableName === table.name && !o.closedTs) : []),
    [table, workspace.orders],
  );
  const total = tableOrders.reduce((a, o) => a + o.total, 0);
  const rate = workspace.settings.taxRate;
  const net = total / (1 + rate / 100);
  const tax = total - net;

  const mins = (seatedAt: number | null) =>
    seatedAt ? Math.max(0, Math.round((Date.now() - seatedAt) / 60000)) : 0;

  return (
    <>
      <div className="mb-4 flex gap-2">
        {STATES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStateFilter(s)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
              stateFilter === s
                ? "border-foreground bg-foreground font-bold text-white"
                : "border-border bg-white text-muted-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {tables.map((t) => {
          const Icon = STATE_ICON[t.state];
          const booking = workspace.bookings.find((b) => b.tableName === t.name);
          const detail =
            t.state === "Seated"
              ? `Seated ${mins(t.seatedAt)} min · ${hhmm(t.seatedAt as number)}`
              : t.state === "Booked"
                ? booking
                  ? `${booking.time} · ${booking.name}`
                  : "Reserved"
                : t.state === "Finished"
                  ? "Awaiting reset"
                  : "Ready for guests";
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTableId(t.id)}
              className="rounded-xl border bg-white p-4.5 text-left transition-colors hover:border-gray-300"
            >
              <span className="flex items-start justify-between">
                <span>
                  <span className="block text-[17px] font-bold">{t.name}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t.seats} seats · {t.zone}
                  </span>
                </span>
                <Badge className={tableStateTone(t.state)}>{t.state}</Badge>
              </span>
              <span className="mt-4.5 flex items-center gap-1.5 text-sm">
                <Icon size={15} weight="bold" className="text-muted-foreground" />
                {detail}
              </span>
            </button>
          );
        })}
      </div>

      <Dialog open={!!table} onOpenChange={(o) => !o && setTableId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{table?.name}</DialogTitle>
          </DialogHeader>
          {table && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 border-b pb-3.5">
                <Badge className={tableStateTone(table.state)}>{table.state}</Badge>
                <span className="text-[13px] text-muted-foreground">
                  {table.seats} seats · {table.zone}
                </span>
                <span className="flex-1" />
                {table.seatedAt && (
                  <span className="text-[13px] font-semibold">
                    Seated {mins(table.seatedAt)} min (since {hhmm(table.seatedAt)})
                  </span>
                )}
              </div>

              {tableOrders.length === 0 ? (
                <p className="py-7 text-center text-sm text-muted-foreground">
                  Nothing ordered yet.
                </p>
              ) : (
                <div>
                  {tableOrders.map((o) => (
                    <div key={o.id} className="border-b py-3.5 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold">{o.code}</span>
                        <Badge className={orderTone(o.status, flow)}>{o.status}</Badge>
                        <span className="flex-1" />
                        <span className="text-[13px] text-muted-foreground">{hhmm(o.ts)}</span>
                      </div>
                      {o.lines.map((l) => (
                        <div key={l.itemId} className="flex items-baseline gap-2.5 py-1 text-sm">
                          <span className="w-6.5 font-bold text-muted-foreground">{l.qty}×</span>
                          <span className="flex-1">
                            {l.name}
                            {l.note && (
                              <span className="block text-[13px] text-muted-foreground">
                                {l.note}
                              </span>
                            )}
                          </span>
                          <span className="font-semibold">{fmt(l.price * l.qty)}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  <div className="mt-1">
                    <div className="flex justify-between pt-3.5 text-[13px] text-muted-foreground">
                      <span>Net</span>
                      <span>{fmt(net)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 text-[13px] text-muted-foreground">
                      <span>Tax ({rate}%)</span>
                      <span>{fmt(tax)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <span className="text-sm font-semibold">Pre-checkout total</span>
                      <span className="text-xl font-bold">{fmt(total)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-1">
                {(table.state === "Free" || table.state === "Booked") && (
                  <Button
                    onClick={() => {
                      seatTable(table.id);
                    }}
                  >
                    Seat guests
                  </Button>
                )}
                {table.state === "Seated" && tableOrders.length > 0 && (
                  <Button
                    onClick={() => {
                      checkoutTable(table.id);
                      setTableId(null);
                    }}
                  >
                    Check out
                  </Button>
                )}
                {(table.state === "Finished" || table.state === "Booked") && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      freeTable(table.id);
                    }}
                  >
                    Mark free
                  </Button>
                )}
                <span className="flex-1" />
                <Button variant="secondary" onClick={() => setTableId(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
