"use client";

import { useEffect, useState } from "react";
import { ClockCounterClockwise, PencilSimple, Plus, Trash, UsersThree } from "@phosphor-icons/react";
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
import { SessionDetailDialog } from "@/components/session-detail-dialog";
import { useWorkspace } from "@/components/workspace-provider";
import { useAsyncAction } from "@/hooks/use-async-action";
import { groupOrdersIntoSessions, type OrderSession } from "@/lib/order-math";
import { formatStamp } from "@/lib/range";
import { orderTone } from "@/lib/tone";
import type { TableRec } from "@/lib/types";

const NEW_ZONE = "__new";

export function TablesPanel({ createSignal }: { createSignal: number }) {
  const { workspace, flow, fmt, saveTable, deleteTable } = useWorkspace();
  const { run, isPending } = useAsyncAction();
  const [editing, setEditing] = useState<TableRec | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", seats: "4", zone: "", newZone: "" });
  const [historyTable, setHistoryTable] = useState<TableRec | null>(null);
  const [session, setSession] = useState<OrderSession | null>(null);

  const tableSessions = (table: TableRec) => groupOrdersIntoSessions(workspace.orders, table.name);

  const startCreate = () => {
    setEditing(null);
    setForm({
      name: `Table ${workspace.tables.length + 1}`,
      seats: "4",
      zone: workspace.zones[0] ?? NEW_ZONE,
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
    setForm({ name: table.name, seats: String(table.seats), zone: table.zone, newZone: "" });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    const zone = form.zone === NEW_ZONE ? form.newZone.trim() : form.zone;
    const ok = await run("save-table", () =>
      saveTable({
        id: editing?.id,
        name: form.name.trim(),
        seats: Number(form.seats) || 2,
        zone: zone || workspace.zones[0] || "—",
      }),
    );
    if (ok) setOpen(false);
  };

  return (
    <>
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
        {workspace.tables.map((table) => (
          <Card key={table.id}>
            <CardContent>
              <p className="text-base font-bold">{table.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{table.zone}</p>
              <p className="mt-4 flex items-center gap-1.5 text-sm">
                <UsersThree size={16} weight="bold" className="text-muted-foreground" />
                {table.seats} seats
              </p>
              <div className="mt-4 flex justify-end gap-3.5 border-t pt-3.5">
                <button
                  type="button"
                  onClick={() => setHistoryTable(table)}
                  className="mr-auto text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`History for ${table.name}`}
                >
                  <ClockCounterClockwise size={15} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(table)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={`Edit ${table.name}`}
                >
                  <PencilSimple size={15} weight="bold" />
                </button>
                <button
                  type="button"
                  disabled={isPending(`delete-${table.id}`)}
                  onClick={() =>
                    run(`delete-${table.id}`, () => deleteTable(table.id), "Failed to delete table.")
                  }
                  className="text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                  aria-label={`Delete ${table.name}`}
                >
                  <Trash size={15} weight="bold" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}

        <button
          type="button"
          onClick={startCreate}
          className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Plus size={18} weight="bold" />
          Add table
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit table" : "New table"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="table-name">Name</Label>
              <Input
                id="table-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="table-seats">Seats</Label>
              <Input
                id="table-seats"
                type="number"
                value={form.seats}
                onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Zone</Label>
              <Select
                value={form.zone}
                onValueChange={(zone) => setForm((f) => ({ ...f, zone }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a zone" />
                </SelectTrigger>
                <SelectContent>
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
                  placeholder="e.g. Garden"
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
            <DialogTitle>{historyTable?.name} — order history</DialogTitle>
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
