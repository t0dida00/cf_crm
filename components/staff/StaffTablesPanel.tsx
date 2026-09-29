"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CheckCircle, Clock, ClockCounterClockwise, Receipt } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { BillReceipt, PrintReceiptButton } from "@/components/orders/BillReceipt";
import { SessionDetailDialog } from "@/components/orders/SessionDetailDialog";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { formatTaxRates, groupOrdersIntoSessions, type OrderSession } from "@/lib/orderMath";
import { formatStamp, hhmm } from "@/lib/range";
import { tableStateTone, orderTone } from "@/lib/tone";
import { groupByZone, hasZone } from "@/lib/zone";
import { TableTile } from "@/components/common/TableTile";
import type { TableRec, TableState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { statusLabel } from "@/lib/i18n/labels";

const STATES: (TableState | "All")[] = ["All", "Free", "Booked", "Seated", "Finished"];

const STATE_ICON = { Seated: Clock, Booked: CalendarCheck, Finished: Receipt, Free: CheckCircle };

export function StaffTablesPanel() {
  const router = useRouter();
  const { t } = useTranslation();
  const { workspace, flow, fmt, seatTable, checkoutTable, freeTable } = useWorkspace();
  const { run, isPending } = useAsyncAction();
  const [stateFilter, setStateFilter] = useState<TableState | "All">("All");
  const [tableId, setTableId] = useState<string | null>(null);
  const [billOpen, setBillOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [session, setSession] = useState<OrderSession | null>(null);

  const tables = workspace.tables.filter(
    (rec) => stateFilter === "All" || rec.state === stateFilter,
  );
  const table = workspace.tables.find((rec) => rec.id === tableId) ?? null;
  const groups = groupByZone(tables, workspace.zones);

  // The line under each table: what's happening there now.
  const tableDetail = (rec: TableRec) => {
    if (rec.state === "Seated") return t("staff.tables.seated");
    if (rec.state === "Finished") return t("staff.tables.finished");
    if (rec.state === "Booked") {
      const booking = workspace.bookings.find((b) => b.tableName === rec.name);
      return booking ? t("staff.tables.bookedBy", { name: booking.name, time: booking.time }) : t("staff.tables.reserved");
    }
    return t("staff.tables.ready");
  };
  const stateLabel = (state: TableState | "All") => t(`staff.tableState.${state}`);

  const tableOrders = useMemo(
    () => (table ? workspace.orders.filter((o) => o.tableName === table.name && !o.closedTs) : []),
    [table, workspace.orders],
  );
  const tableSessions = useMemo(
    () => (table ? groupOrdersIntoSessions(workspace.orders, table.name) : []),
    [table, workspace.orders],
  );
  const total = tableOrders.reduce((a, o) => a + o.total, 0);
  // Each order carries its own snapshotted tax rate (fixed at creation, unaffected
  // by later Settings changes) — sum net/tax per order rather than applying one
  // blended rate to the combined total, since open orders can have different rates.
  const net = tableOrders.reduce((a, o) => a + o.total / (1 + o.taxRate / 100), 0);
  const tax = total - net;


  return (
    <>
      <div role="group" aria-label={t("staff.tables.filter")} className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 md:-mx-6 md:px-6">
        {STATES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStateFilter(s)}
            aria-pressed={stateFilter === s}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
              stateFilter === s
                ? "border-foreground bg-foreground font-bold text-white"
                : "border-border bg-white text-muted-foreground",
            )}
          >
            {stateLabel(s)}
          </button>
        ))}
      </div>

      {/* The same floor plan as the admin Tables tab, coloured by each table's state. */}
      <div className="space-y-8">
        {groups.map(({ zone, tables: zoneTables }) => {
          const heading = zone || (groups.length > 1 ? t("admin.tables.noZone") : "");
          return (
            <section key={zone || "no-zone"} aria-label={heading || t("shell.tabs.tables")}>
              {heading && (
                <h2 className="mb-3 flex items-baseline gap-3">
                  <span className="text-lg font-bold">{heading}</span>
                  <span className="text-sm text-muted-foreground">
                    {t("admin.tables.count", { count: zoneTables.length, n: zoneTables.length })}
                  </span>
                </h2>
              )}
              <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))] sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]">
                {zoneTables.map((rec) => {
                  const Icon = STATE_ICON[rec.state];
                  return (
                    <TableTile
                      key={rec.id}
                      table={rec}
                      tone={rec.state}
                      aside={<Badge className={tableStateTone(rec.state)}>{stateLabel(rec.state)}</Badge>}
                      footer={
                        <span className="flex items-center gap-1.5 border-t pt-2.5 text-sm">
                          <Icon size={15} weight="bold" className="shrink-0 text-muted-foreground" aria-hidden />
                          <span className="min-w-0 truncate">{tableDetail(rec)}</span>
                        </span>
                      }
                      onOpen={() => setTableId(rec.id)}
                    />
                  );
                })}
              </ul>
            </section>
          );
        })}
        {groups.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            {stateFilter === "All" ? t("staff.tables.noTables") : t("staff.tables.noneInState", { state: stateLabel(stateFilter).toLowerCase() })}
          </p>
        )}
      </div>

      <Dialog open={!!table} onOpenChange={(o) => !o && setTableId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{table?.name}</DialogTitle>
          </DialogHeader>
          {table && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 border-b pb-3.5">
                <Badge className={tableStateTone(table.state)}>{stateLabel(table.state)}</Badge>
                <span className="text-[13px] text-muted-foreground">
                  {t("admin.tables.seats", { count: table.seats, n: table.seats })}{hasZone(table.zone) ? `, ${table.zone}` : ""}
                </span>
                <span className="flex-1" />
              </div>

              {tableOrders.length === 0 ? (
                <div className="py-7 text-center">
                  <p className="text-sm text-muted-foreground">{t("staff.tables.nothingOrdered")}</p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push("/staff?tab=menu")}
                  >
                    {t("staff.tables.orderNow")}
                  </Button>
                </div>
              ) : (
                <div>
                  {tableOrders.map((o) => (
                    <div key={o.id} className="border-b py-3.5 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm font-bold">{o.code}</span>
                        <Badge className={orderTone(o.status, flow)}>{statusLabel(t, o.status)}</Badge>
                        <span className="flex-1" />
                        <span className="text-[13px] text-muted-foreground">{hhmm(o.ts)}</span>
                      </div>
                      {o.lines.map((l) => (
                        <div key={l.id ?? l.itemId} className="flex items-baseline gap-2.5 py-1 text-sm">
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
                      <span>{t("bill.net")}</span>
                      <span>{fmt(net)}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 text-[13px] text-muted-foreground">
                      <span>{t("bill.tax", { rates: formatTaxRates(tableOrders) })}</span>
                      <span>{fmt(tax)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <span className="text-sm font-semibold">{t("staff.tables.preCheckout")}</span>
                      <span className="text-xl font-bold">{fmt(total)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2.5 pt-1">
                {(table.state === "Free" || table.state === "Booked") && (
                  <Button
                    loading={isPending(`seat-${table.id}`)}
                    onClick={() => run(`seat-${table.id}`, () => seatTable(table.id), t("staff.tables.seatFailed"))}
                  >
                    {t("staff.tables.seat")}
                  </Button>
                )}
                {table.state === "Seated" && tableOrders.length > 0 && (
                  <Button onClick={() => setBillOpen(true)}>{t("staff.tables.checkOut")}</Button>
                )}
                {(table.state === "Finished" ||
                  table.state === "Booked" ||
                  (table.state === "Seated" && tableOrders.length === 0)) && (
                  <Button
                    variant="secondary"
                    loading={isPending(`free-${table.id}`)}
                    onClick={async () => {
                      const ok = await run(`free-${table.id}`, () => freeTable(table.id), t("staff.tables.freeFailed"));
                      if (ok) setTableId(null);
                    }}
                  >
                    {t("staff.tables.markFree")}
                  </Button>
                )}
                <Button variant="secondary" onClick={() => setHistoryOpen(true)}>
                  <ClockCounterClockwise size={15} weight="bold" />
                  {t("staff.tables.history")}
                </Button>
                <span className="flex-1" />
                <Button variant="secondary" onClick={() => setTableId(null)}>
                  {t("staff.tables.close")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={billOpen} onOpenChange={setBillOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("staff.tables.billTitle", { table: table?.name ?? "" })}</DialogTitle>
          </DialogHeader>
          {table && (
            <div>
              <BillReceipt
                workspaceName={workspace.name}
                workspaceAddress={workspace.address}
                workspacePhone={workspace.phone}
                tableName={table.name}
                orders={tableOrders}
                net={net}
                tax={tax}
                total={total}
                fmt={fmt}
              />

              <div className="mt-5 flex items-center gap-2.5">
                <Button variant="secondary" onClick={() => setBillOpen(false)}>
                  {t("staff.tables.back")}
                </Button>
                <PrintReceiptButton
                  workspaceName={workspace.name}
                  workspaceAddress={workspace.address}
                  workspacePhone={workspace.phone}
                  tableName={table.name}
                  orders={tableOrders}
                  net={net}
                  tax={tax}
                  total={total}
                  fmt={fmt}
                />
                <span className="flex-1" />
                <Button
                  loading={isPending(`checkout-${table.id}`)}
                  onClick={async () => {
                    const ok = await run(
                      `checkout-${table.id}`,
                      () => checkoutTable(table.id),
                      t("staff.tables.checkoutFailed"),
                    );
                    if (ok) {
                      setBillOpen(false);
                      setTableId(null);
                    }
                  }}
                >
                  {t("staff.tables.confirmCheckout")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("staff.tables.historyTitle", { table: table?.name ?? "" })}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {tableSessions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("staff.tables.noOrders")}
              </p>
            ) : (
              tableSessions.map((s) => {
                const multi = s.orders.length > 1;
                return (
                  <button
                    key={s.orders[0].id}
                    type="button"
                    onClick={() => setSession(s)}
                    className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-secondary"
                  >
                    <span className="font-semibold">
                      {multi ? t("staff.tables.multiple", { n: s.orders.length }) : s.orders[0].code}
                    </span>
                    <span className="text-sm text-muted-foreground">{formatStamp(s.ts)}</span>
                    <span className="flex-1" />
                    <span className="font-semibold">{fmt(s.total)}</span>
                    {!multi && (
                      <Badge className={orderTone(s.orders[0].status, flow)}>
                        {statusLabel(t, s.orders[0].status)}
                      </Badge>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SessionDetailDialog session={session} onClose={() => setSession(null)} />
    </>
  );
}
