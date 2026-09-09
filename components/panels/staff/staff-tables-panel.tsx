"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CheckCircle, Clock, Printer, Receipt } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWorkspace } from "@/components/workspace-provider";
import { formatStamp, hhmm } from "@/lib/range";
import { tableStateTone, orderTone } from "@/lib/tone";
import type { Order, TableRec, TableState } from "@/lib/types";
import { cn } from "@/lib/utils";

const STATES: (TableState | "All")[] = ["All", "Free", "Booked", "Seated", "Finished"];

const STATE_ICON = { Seated: Clock, Booked: CalendarCheck, Finished: Receipt, Free: CheckCircle };

interface BillReceiptProps {
  workspaceName: string;
  workspaceAddress?: string;
  workspacePhone?: string;
  table: TableRec;
  orders: Order[];
  net: number;
  tax: number;
  total: number;
  fmt: (value: number) => string;
}

/** Plain-text, dashed-rule layout matching a till receipt — used only inside
 * #bill-print-area (see globals.scss's @media print block), which supplies
 * its own fixed-width monospace styling. Tailwind classes don't survive
 * print's own width/margins the way they do in the dialog, so this renders
 * with semantic bill-* class names instead. */
function PrintableBillReceipt({
  workspaceName,
  workspaceAddress,
  workspacePhone,
  table,
  orders,
  net,
  tax,
  total,
  fmt,
}: BillReceiptProps) {
  return (
    <div>
      <div className="bill-center">
        <p className="bill-name">{workspaceName}</p>
        {workspaceAddress && <p>{workspaceAddress}</p>}
        {workspacePhone && <p>{workspacePhone}</p>}
      </div>

      <div className="bill-rule" />
      <div className="bill-row">
        <span>{table.name}</span>
        <span>{formatStamp(Date.now())}</span>
      </div>
      <div className="bill-rule" />

      {orders.map((o) => (
        <div key={o.id}>
          <div className="bill-row bill-muted">
            <span>{o.code}</span>
            <span>{formatStamp(o.ts)}</span>
          </div>
          {o.lines.map((l) => (
            <div key={l.itemId}>
              <div className="bill-row">
                <span className="bill-item-name">
                  {l.qty}× {l.name}
                </span>
                <span>{fmt(l.price * l.qty)}</span>
              </div>
              {l.note && <div className="bill-muted">{l.note}</div>}
            </div>
          ))}
          <div className="bill-rule" />
        </div>
      ))}

      <div className="bill-row bill-muted">
        <span>Net</span>
        <span>{fmt(net)}</span>
      </div>
      <div className="bill-row bill-muted">
        <span>Tax</span>
        <span>{fmt(tax)}</span>
      </div>
      <div className="bill-rule" />
      <div className="bill-total-row">
        <span>Total due</span>
        <span>{fmt(total)}</span>
      </div>
    </div>
  );
}

function BillReceipt({
  workspaceName,
  workspaceAddress,
  workspacePhone,
  table,
  orders,
  net,
  tax,
  total,
  fmt,
}: BillReceiptProps) {
  return (
    <div>
      <div className="text-center">
        <p className="text-base font-bold">{workspaceName}</p>
        {workspaceAddress && (
          <p className="text-[13px] text-muted-foreground">{workspaceAddress}</p>
        )}
        {workspacePhone && (
          <p className="text-[13px] text-muted-foreground">{workspacePhone}</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-y py-2.5 text-[13px] text-muted-foreground">
        <span>{table.name}</span>
        <span>{formatStamp(Date.now())}</span>
      </div>

      {orders.map((o) => (
        <div key={o.id} className="border-b py-3 last:border-0">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold">{o.code}</span>
            <span className="flex-1" />
            <span className="text-[13px] text-muted-foreground">{formatStamp(o.ts)}</span>
          </div>
          {o.lines.map((l) => (
            <div key={l.itemId} className="flex items-baseline gap-2.5 py-1 text-sm">
              <span className="w-6.5 font-bold text-muted-foreground">{l.qty}×</span>
              <span className="flex-1">
                {l.name}
                {l.note && (
                  <span className="block text-[13px] text-muted-foreground">{l.note}</span>
                )}
              </span>
              <span className="text-muted-foreground">{fmt(l.price)}</span>
              <span className="w-16 text-right font-semibold">{fmt(l.price * l.qty)}</span>
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
          <span>Tax</span>
          <span>{fmt(tax)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-sm font-semibold">Total due</span>
          <span className="text-xl font-bold">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}

export function StaffTablesPanel() {
  const { workspace, flow, fmt, seatTable, checkoutTable, freeTable } = useWorkspace();
  const [stateFilter, setStateFilter] = useState<TableState | "All">("All");
  const [tableId, setTableId] = useState<string | null>(null);
  const [billOpen, setBillOpen] = useState(false);

  const tables = workspace.tables.filter(
    (t) => stateFilter === "All" || t.state === stateFilter,
  );
  const table = workspace.tables.find((t) => t.id === tableId) ?? null;

  const tableOrders = useMemo(
    () => (table ? workspace.orders.filter((o) => o.tableName === table.name && !o.closedTs) : []),
    [table, workspace.orders],
  );
  const total = tableOrders.reduce((a, o) => a + o.total, 0);
  // Each order carries its own snapshotted tax rate (fixed at creation, unaffected
  // by later Settings changes) — sum net/tax per order rather than applying one
  // blended rate to the combined total, since open orders can have different rates.
  const net = tableOrders.reduce((a, o) => a + o.total / (1 + o.taxRate / 100), 0);
  const tax = total - net;

  const mins = (seatedAt: number | null) =>
    seatedAt ? Math.max(0, Math.round((Date.now() - seatedAt) / 60000)) : 0;

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {STATES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStateFilter(s)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors",
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
                      <span>Tax</span>
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
                  <Button onClick={() => setBillOpen(true)}>Check out</Button>
                )}
                {(table.state === "Finished" ||
                  table.state === "Booked" ||
                  (table.state === "Seated" && tableOrders.length === 0)) && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      freeTable(table.id);
                      setTableId(null);
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

      <Dialog open={billOpen} onOpenChange={setBillOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bill — {table?.name}</DialogTitle>
          </DialogHeader>
          {table && (
            <div>
              <BillReceipt
                workspaceName={workspace.name}
                workspaceAddress={workspace.address}
                workspacePhone={workspace.phone}
                table={table}
                orders={tableOrders}
                net={net}
                tax={tax}
                total={total}
                fmt={fmt}
              />

              <div className="mt-5 flex items-center gap-2.5">
                <Button variant="secondary" onClick={() => setBillOpen(false)}>
                  Back
                </Button>
                <Button variant="secondary" onClick={() => window.print()}>
                  <Printer size={15} weight="bold" />
                  Print
                </Button>
                <span className="flex-1" />
                <Button
                  onClick={() => {
                    checkoutTable(table.id);
                    setBillOpen(false);
                    setTableId(null);
                  }}
                >
                  Confirm checkout
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {billOpen && table && (
        <div id="bill-print-area" className="hidden">
          <PrintableBillReceipt
            workspaceName={workspace.name}
            workspaceAddress={workspace.address}
            workspacePhone={workspace.phone}
            table={table}
            orders={tableOrders}
            net={net}
            tax={tax}
            total={total}
            fmt={fmt}
          />
        </div>
      )}
    </>
  );
}
