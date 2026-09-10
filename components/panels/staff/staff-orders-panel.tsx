"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, MagnifyingGlass, Plus, Trash } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useAsyncAction } from "@/hooks/use-async-action";
import { hhmm } from "@/lib/range";
import { orderTone } from "@/lib/tone";
import type { Order } from "@/lib/types";

export function StaffOrdersPanel() {
  const {
    workspace,
    flow,
    fmt,
    addOrder,
    advanceOrder,
    deleteOrder,
    setOrderLineQty,
    addOrderLine,
  } = useWorkspace();
  const { run, isPending } = useAsyncAction();
  const [query, setQuery] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [addDishId, setAddDishId] = useState(workspace.dishes[0]?.id ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ tableName: "", itemId: "", qty: "1" });
  const [servingId, setServingId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  // Keep a just-closed order visible for a few seconds after it lands on "Paid" so
  // staff see the confirmation before it drops out of the list into History. Only
  // orders seen open *during this session* get the grace period — orders that were
  // already closed before mount (e.g. paid yesterday) skip straight past it.
  const [recentlyClosedIds, setRecentlyClosedIds] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const seenOpenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    for (const order of workspace.orders) {
      if (!order.closedTs) {
        seenOpenIdsRef.current.add(order.id);
        continue;
      }
      if (seenOpenIdsRef.current.has(order.id) && !timersRef.current.has(order.id)) {
        seenOpenIdsRef.current.delete(order.id);
        setRecentlyClosedIds((prev) => new Set(prev).add(order.id));
        const timer = setTimeout(() => {
          setRecentlyClosedIds((prev) => {
            const next = new Set(prev);
            next.delete(order.id);
            return next;
          });
          timersRef.current.delete(order.id);
        }, 5000);
        timersRef.current.set(order.id, timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace.orders]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const open = useMemo(() => {
    const q = query.toLowerCase();
    return workspace.orders.filter(
      (o) =>
        (!o.closedTs || recentlyClosedIds.has(o.id)) &&
        (!q || o.code.toLowerCase().includes(q) || o.tableName.toLowerCase().includes(q)),
    );
  }, [workspace.orders, query, recentlyClosedIds]);

  const editing: Order | null = workspace.orders.find((o) => o.id === editId) ?? null;
  const serving: Order | null = workspace.orders.find((o) => o.id === servingId) ?? null;
  const allChecked =
    !!serving && serving.lines.length > 0 && serving.lines.every((l) => checkedItems.has(l.itemId));

  const startCreate = () => {
    setForm({
      tableName: workspace.tables[0]?.name ?? "",
      itemId: workspace.dishes[0]?.id ?? "",
      qty: "1",
    });
    setCreateOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order ID"
            className="pl-9"
          />
        </div>
        <div className="hidden flex-1 sm:block" />
        <Button size="sm" onClick={startCreate}>
          <Plus size={14} weight="bold" />
          New order
        </Button>
      </div>

      {open.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No open orders.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
          {open.map((order) => {
            const i = flow.indexOf(order.status);
            const canAdvance = i > -1 && i < flow.length - 1;
            return (
              <Card key={order.id}>
                <CardContent>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[15px] font-bold">{order.code}</span>
                    <Badge className={orderTone(order.status, flow)}>{order.status}</Badge>
                    <span className="flex-1" />
                    <span className="text-[13px] text-muted-foreground">{order.tableName}</span>
                  </div>

                  <div className="mt-3 space-y-1 border-t pt-3">
                    {order.lines.map((line) => (
                      <div key={line.itemId} className="flex items-baseline gap-2.5 text-sm">
                        <span className="w-6.5 font-bold text-muted-foreground">{line.qty}×</span>
                        <span className="flex-1">
                          {line.name}
                          {line.note && (
                            <span className="block text-[13px] text-muted-foreground">
                              {line.note}
                            </span>
                          )}
                        </span>
                        <span className="font-semibold">{fmt(line.price * line.qty)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center gap-3.5 border-t pt-3">
                    <span className="text-[13px] text-muted-foreground">
                      Opened {hhmm(order.ts)}
                    </span>
                    <span className="flex-1" />
                    <span className="text-base font-bold">{fmt(order.total)}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2.5">
                    {canAdvance && (
                      <Button
                        size="sm"
                        loading={isPending(`advance-${order.id}`)}
                        onClick={() => {
                          if (order.status === "Preparing") {
                            setCheckedItems(new Set());
                            setServingId(order.id);
                            return;
                          }
                          run(`advance-${order.id}`, () => advanceOrder(order.id), "Failed to update order.");
                        }}
                      >
                        {flow[i + 1]}
                        <ArrowRight size={12} weight="bold" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setAddDishId(workspace.dishes[0]?.id ?? "");
                        setEditId(order.id);
                      }}
                    >
                      Modify
                    </Button>
                    <span className="flex-1" />
                    <button
                      type="button"
                      disabled={isPending(`delete-${order.id}`)}
                      onClick={() =>
                        run(`delete-${order.id}`, () => deleteOrder(order.id), "Failed to delete order.")
                      }
                      className="text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                      aria-label={`Delete ${order.code}`}
                    >
                      <Trash size={15} weight="bold" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Modify ${editing.code} · ${editing.tableName}` : ""}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                {editing.lines.map((line) => (
                  <div
                    key={line.itemId}
                    className="flex items-center gap-3 border-b py-2.5 last:border-0"
                  >
                    <span className="flex-1 text-[15px]">{line.name}</span>
                    <span className="text-[13px] text-muted-foreground">{fmt(line.price)}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary p-0.75">
                      <button
                        type="button"
                        disabled={isPending(`qty-${line.itemId}`)}
                        onClick={() =>
                          run(`qty-${line.itemId}`, () =>
                            setOrderLineQty(editing.id, line.itemId, line.qty - 1),
                          )
                        }
                        className="flex size-6.5 items-center justify-center rounded-full bg-white text-foreground disabled:pointer-events-none disabled:opacity-50"
                        aria-label={`Decrease ${line.name}`}
                      >
                        −
                      </button>
                      <span className="min-w-4.5 text-center text-sm font-bold">{line.qty}</span>
                      <button
                        type="button"
                        disabled={isPending(`qty-${line.itemId}`)}
                        onClick={() =>
                          run(`qty-${line.itemId}`, () =>
                            setOrderLineQty(editing.id, line.itemId, line.qty + 1),
                          )
                        }
                        className="flex size-6.5 items-center justify-center rounded-full bg-brand-500 text-white disabled:pointer-events-none disabled:opacity-50"
                        aria-label={`Increase ${line.name}`}
                      >
                        +
                      </button>
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <Select value={addDishId} onValueChange={setAddDishId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workspace.dishes.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} · {fmt(d.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="secondary"
                  loading={isPending("add-line")}
                  onClick={() =>
                    addDishId && run("add-line", () => addOrderLine(editing.id, addDishId))
                  }
                >
                  Add item
                </Button>
              </div>

              <div className="flex items-center justify-between border-t pt-3.5">
                <span className="text-sm font-semibold">Order total</span>
                <span className="text-xl font-bold">{fmt(editing.total)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            {editing && (
              <Button
                variant="ghost"
                className="mr-auto"
                loading={isPending(`delete-${editing.id}`)}
                onClick={async () => {
                  const ok = await run(`delete-${editing.id}`, () => deleteOrder(editing.id), "Failed to delete order.");
                  if (ok) setEditId(null);
                }}
              >
                Delete order
              </Button>
            )}
            <Button onClick={() => setEditId(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!serving} onOpenChange={(o) => !o && setServingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {serving ? `Confirm ${serving.code} · ${serving.tableName}` : ""}
            </DialogTitle>
          </DialogHeader>
          {serving && (
            <div className="space-y-1">
              <p className="mb-2 text-[13px] text-muted-foreground">
                Check off each dish as it leaves the kitchen.
              </p>
              {serving.lines.map((line) => {
                const checked = checkedItems.has(line.itemId);
                return (
                  <label
                    key={line.itemId}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border py-2.5 px-3 text-sm transition-colors hover:bg-secondary"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) =>
                        setCheckedItems((prev) => {
                          const next = new Set(prev);
                          if (value === true) next.add(line.itemId);
                          else next.delete(line.itemId);
                          return next;
                        })
                      }
                    />
                    <span className="w-6.5 font-bold text-muted-foreground">{line.qty}×</span>
                    <span className="flex-1">{line.name}</span>
                  </label>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setServingId(null)}>
              Cancel
            </Button>
            <Button
              disabled={!allChecked}
              loading={!!serving && isPending(`advance-${serving.id}`)}
              onClick={async () => {
                if (!serving) return;
                const ok = await run(
                  `advance-${serving.id}`,
                  () => advanceOrder(serving.id),
                  "Failed to update order.",
                );
                if (ok) setServingId(null);
              }}
            >
              {serving ? flow[flow.indexOf(serving.status) + 1] : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="space-y-1.5">
              <Label>Dish</Label>
              <Select
                value={form.itemId}
                onValueChange={(itemId) => setForm((f) => ({ ...f, itemId }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workspace.dishes.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name} · {fmt(d.price)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-order-qty">Quantity</Label>
              <Input
                id="staff-order-qty"
                type="number"
                value={form.qty}
                onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={isPending("create-order")}
              onClick={async () => {
                if (!form.tableName || !form.itemId) return;
                const ok = await run("create-order", () =>
                  addOrder({
                    tableName: form.tableName,
                    itemId: form.itemId,
                    qty: Number(form.qty) || 1,
                  }),
                );
                if (ok) setCreateOpen(false);
              }}
            >
              Open order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
