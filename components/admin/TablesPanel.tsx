"use client";

import { useTranslation } from "react-i18next";
import { statusLabel } from "@/lib/i18n/labels";
import { useEffect, useState } from "react";
import { ClockCounterClockwise, PencilSimple, Plus } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FieldError, fieldErrorProps } from "@/components/common/FieldError";
import { RequiredLabel } from "@/components/common/RequiredLabel";
import { blockInvalidNumberKeys, validateTable, type FieldErrors, withFieldError } from "@/lib/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { SessionDetailDialog } from "@/components/orders/SessionDetailDialog";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { savedMessage, useAsyncAction } from "@/hooks/useAsyncAction";
import { groupOrdersIntoSessions, type OrderSession } from "@/lib/orderMath";
import { formatStamp } from "@/lib/range";
import { orderTone } from "@/lib/tone";
import type { TableRec } from "@/lib/types";
import { TableTile } from "@/components/common/TableTile";
import { groupByZone } from "@/lib/zone";
import { cn } from "@/lib/utils";

const NEW_ZONE = "__new";
// Zone is optional; a Select item can't have an empty value, so "no zone" has its own.
const NO_ZONE = "__none";

export function TablesPanel({ createSignal }: { createSignal: number }) {
  const { t } = useTranslation();
  const { workspace, flow, fmt, saveTable, deleteTable } = useWorkspace();
  const { run, isPending } = useAsyncAction();
  const [editing, setEditing] = useState<TableRec | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", seats: "4", zone: "", newZone: "" });
  const [errors, setErrors] = useState<FieldErrors<"name" | "seats">>({});
  const [historyTable, setHistoryTable] = useState<TableRec | null>(null);
  const [session, setSession] = useState<OrderSession | null>(null);

  const groups = groupByZone(workspace.tables, workspace.zones);
  const tableSessions = (table: TableRec) => groupOrdersIntoSessions(workspace.orders, table.name);

  const startCreate = () => {
    setEditing(null);
    setErrors({});
    setForm({
      name: t("common.tableName", { n: workspace.tables.length + 1 }),
      seats: "4",
      zone: workspace.zones[0] ?? NO_ZONE,
      newZone: "",
    });
    setOpen(true);
  };

  useEffect(() => {
    if (createSignal > 0) startCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSignal]);

  const startEdit = (table: TableRec) => {
    setEditing(table);
    setErrors({});
    setForm({ name: table.name, seats: String(table.seats), zone: table.zone || NO_ZONE, newZone: "" });
    setOpen(true);
  };

  const submit = async () => {
    const found = validateTable(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    // No zone, or "+ New zone" left blank, saves the table without one.
    const zone = form.zone === NEW_ZONE ? form.newZone.trim() : form.zone === NO_ZONE ? "" : form.zone;
    const ok = await run("save-table", () =>
      saveTable({
        id: editing?.id,
        name: form.name.trim(),
        seats: Number(form.seats),
        zone,
      }), undefined, savedMessage()
    );
    if (ok) setOpen(false);
  };

  return (
    <>
      {/* The floor plan: one section per zone, each table drawn with its chairs. */}
      <div className="space-y-8">
        {groups.map(({ zone, tables }, i) => {
          const seats = tables.reduce((n, t) => n + t.seats, 0);
          const last = i === groups.length - 1;
          const heading = zone || (groups.length > 1 ? t("admin.tables.noZone") : "");
          return (
            <section key={zone || NO_ZONE} aria-label={heading || t("admin.tables.tables")}>
              {heading && (
                <h2 className="mb-3 flex items-baseline gap-3">
                  <span className="text-lg font-bold">{heading}</span>
                  <span className="text-sm text-muted-foreground">
                    {t("admin.tables.count", { count: tables.length, n: tables.length })},{" "}
                    {t("admin.tables.seats", { count: seats, n: seats })}
                  </span>
                </h2>
              )}
              <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(130px,1fr))] sm:[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
                {tables.map((table) => (
                  <TableTile
                    key={table.id}
                    table={table}
                    footer={<TileActions name={table.name} onHistory={() => setHistoryTable(table)} onEdit={() => startEdit(table)} />}
                  />
                ))}
                {last && <li><AddTableButton onClick={startCreate} /></li>}
              </ul>
            </section>
          );
        })}
        {groups.length === 0 && (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
            <p className="text-sm text-muted-foreground">
              {t("admin.tables.empty")}
            </p>
            <Button onClick={startCreate}>
              <Plus size={16} weight="bold" aria-hidden />
              {t("admin.tables.add")}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? t("admin.tables.edit") : t("admin.tables.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="table-name">{t("admin.tables.name")}</RequiredLabel>
              <Input
                id="table-name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                {...fieldErrorProps("table-name", errors.name)}
                onBlur={() => setErrors((e) => withFieldError(e, "name", validateTable(form).name))}
              />
              <FieldError id="table-name" message={errors.name} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="table-seats">{t("admin.tables.seatsLabel")}</RequiredLabel>
              <Input
                id="table-seats"
                type="number"
                min={1}
                step={1}
                required
                value={form.seats}
                onKeyDown={blockInvalidNumberKeys({ whole: true })}
                onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
                {...fieldErrorProps("table-seats", errors.seats)}
                onBlur={() => setErrors((e) => withFieldError(e, "seats", validateTable(form).seats))}
              />
              <FieldError id="table-seats" message={errors.seats} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="table-zone">{t("admin.tables.zone")}</Label>
              <Select
                value={form.zone}
                onValueChange={(zone) => setForm((f) => ({ ...f, zone }))}
              >
                <SelectTrigger id="table-zone" className="w-full">
                  <SelectValue placeholder={t("admin.tables.noZone")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ZONE}>{t("admin.tables.noZone")}</SelectItem>
                  {workspace.zones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_ZONE}>{t("admin.tables.newZone")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.zone === NEW_ZONE && (
              <div className="space-y-1.5">
                <Label htmlFor="table-new-zone">{t("admin.tables.newZoneName")}</Label>
                <Input
                  id="table-new-zone"
                  value={form.newZone}
                  placeholder={t("admin.tables.newZonePlaceholder")}
                  onChange={(e) => setForm((f) => ({ ...f, newZone: e.target.value }))}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            {editing && (
              <Button
                variant="ghost"
                className="mr-auto"
                loading={isPending(`delete-${editing.id}`)}
                onClick={async () => {
                  const ok = await run(`delete-${editing.id}`, () => deleteTable(editing.id), t("admin.tables.deleteFailed"));
                  if (ok) setOpen(false);
                }}
              >
                {t("admin.tables.delete")}
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("admin.tables.cancel")}
            </Button>
            <Button loading={isPending("save-table")} onClick={submit}>
              {editing ? t("admin.tables.save") : t("admin.tables.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyTable} onOpenChange={(o) => !o && setHistoryTable(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("admin.tables.ordersAt", { name: historyTable?.name })}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {historyTable && tableSessions(historyTable).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("admin.tables.noOrders")}
              </p>
            ) : (
              historyTable &&
              tableSessions(historyTable).map((s) => {
                const multi = s.orders.length > 1;
                return (
                  <button
                    key={s.orders[0].id}
                    type="button"
                    onClick={() => setSession(s)}
                    className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-secondary"
                  >
                    <span className="font-semibold">
                      {multi ? t("admin.tables.orderCount", { n: s.orders.length }) : s.orders[0].code}
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

function AddTableButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full min-h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input-border text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <Plus size={18} weight="bold" aria-hidden />
      {t("admin.tables.add")}
    </button>
  );
}

const TILE_ACTION =
  "flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";

/** A table tile's admin actions: its order history and Edit (Delete is in Edit). */
function TileActions({ name, onHistory, onEdit }: { name: string; onHistory: () => void; onEdit: () => void }) {
  const { t } = useTranslation();
  return (
    <span className="-mx-1 -mb-1 flex gap-1 border-t pt-2">
      <button type="button" onClick={onHistory} className={TILE_ACTION} aria-label={t("admin.tables.ordersAt", { name })}>
        <ClockCounterClockwise size={15} weight="bold" aria-hidden />
        {/* Icons only on phones, where two tiles share a row. */}
        <span className="hidden sm:inline">{t("admin.tables.orders")}</span>
      </button>
      <button type="button" onClick={onEdit} className={cn(TILE_ACTION, "ml-auto")} aria-label={t("admin.tables.editName", { name })}>
        <PencilSimple size={15} weight="bold" aria-hidden />
        <span className="hidden sm:inline">{t("admin.tables.editShort")}</span>
      </button>
    </span>
  );
}
