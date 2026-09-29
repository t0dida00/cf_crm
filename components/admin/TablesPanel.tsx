"use client";

import { useEffect, useState } from "react";
import { Plus } from "@phosphor-icons/react";
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
import { SAVED_MESSAGE, useAsyncAction } from "@/hooks/useAsyncAction";
import { groupOrdersIntoSessions, type OrderSession } from "@/lib/orderMath";
import { formatStamp } from "@/lib/range";
import { orderTone } from "@/lib/tone";
import type { TableRec } from "@/lib/types";
import { TableTile } from "./TableTile";
import { hasZone } from "@/lib/zone";

const NEW_ZONE = "__new";
// Zone is optional; a Select item can't have an empty value, so "no zone" has its own.
const NO_ZONE = "__none";

/** Tables grouped by zone, in the workspace's zone order; tables without one come last. */
export function groupByZone(tables: TableRec[], zones: string[]): { zone: string; tables: TableRec[] }[] {
  const order = [...zones, ...tables.map((t) => t.zone)].filter(hasZone);
  const groups = [...new Set(order)]
    .map((zone) => ({ zone, tables: tables.filter((t) => t.zone === zone) }))
    .filter((g) => g.tables.length);
  const loose = tables.filter((t) => !hasZone(t.zone));
  return loose.length ? [...groups, { zone: "", tables: loose }] : groups;
}

export function TablesPanel({ createSignal }: { createSignal: number }) {
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
      name: `Table ${workspace.tables.length + 1}`,
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
      }), undefined, SAVED_MESSAGE
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
          const heading = zone || (groups.length > 1 ? "No zone" : "");
          return (
            <section key={zone || NO_ZONE} aria-label={heading || "Tables"}>
              {heading && (
                <h2 className="mb-3 flex items-baseline gap-3">
                  <span className="text-lg font-bold">{heading}</span>
                  <span className="text-sm text-muted-foreground">
                    {tables.length} {tables.length === 1 ? "table" : "tables"}, {seats} {seats === 1 ? "seat" : "seats"}
                  </span>
                </h2>
              )}
              <ul className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(130px,1fr))] sm:[grid-template-columns:repeat(auto-fill,minmax(180px,1fr))]">
                {tables.map((table) => (
                  <TableTile
                    key={table.id}
                    table={table}
                    onHistory={() => setHistoryTable(table)}
                    onEdit={() => startEdit(table)}
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
              No tables yet. Add the tables guests sit at; each one gets its own QR code.
            </p>
            <Button onClick={startCreate}>
              <Plus size={16} weight="bold" aria-hidden />
              Add table
            </Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit table" : "New table"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="table-name">Name</RequiredLabel>
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
              <RequiredLabel htmlFor="table-seats">Seats</RequiredLabel>
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
              <Label htmlFor="table-zone">Zone (optional)</Label>
              <Select
                value={form.zone}
                onValueChange={(zone) => setForm((f) => ({ ...f, zone }))}
              >
                <SelectTrigger id="table-zone" className="w-full">
                  <SelectValue placeholder="No zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ZONE}>No zone</SelectItem>
                  {workspace.zones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_ZONE}>+ New zone…</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.zone === NEW_ZONE && (
              <div className="space-y-1.5">
                <Label htmlFor="table-new-zone">New zone name</Label>
                <Input
                  id="table-new-zone"
                  value={form.newZone}
                  placeholder="e.g. Garden (leave blank for no zone)"
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
                  const ok = await run(`delete-${editing.id}`, () => deleteTable(editing.id), "Failed to delete table.");
                  if (ok) setOpen(false);
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={isPending("save-table")} onClick={submit}>
              {editing ? "Save table" : "Create table"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyTable} onOpenChange={(o) => !o && setHistoryTable(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Orders at {historyTable?.name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {historyTable && tableSessions(historyTable).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No orders placed at this table yet.
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
                      {multi ? `${s.orders.length} orders` : s.orders[0].code}
                    </span>
                    <span className="text-sm text-muted-foreground">{formatStamp(s.ts)}</span>
                    <span className="flex-1" />
                    <span className="font-semibold">{fmt(s.total)}</span>
                    {!multi && (
                      <Badge className={orderTone(s.orders[0].status, flow)}>
                        {s.orders[0].status}
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
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full min-h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input-border text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      <Plus size={18} weight="bold" aria-hidden />
      Add table
    </button>
  );
}
