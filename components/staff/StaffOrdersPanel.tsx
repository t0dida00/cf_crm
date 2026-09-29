"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, MagnifyingGlass, Plus, Trash } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/Checkbox";
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
import { blockInvalidNumberKeys, countError } from "@/lib/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { savedMessage, useAsyncAction } from "@/hooks/useAsyncAction";
import { hhmm } from "@/lib/range";
import { orderTone } from "@/lib/tone";
import type { Order } from "@/lib/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useTranslation } from "react-i18next";
import { statusLabel } from "@/lib/i18n/labels";

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
  const { t } = useTranslation();
  const { run, isPending } = useAsyncAction();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [editId, setEditId] = useState<string | null>(null);
  const [addDishId, setAddDishId] = useState(workspace.dishes[0]?.id ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ tableName: "", itemId: "", qty: "1" });
  const [qtyError, setQtyError] = useState<string | undefined>();
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
    const q = debouncedQuery.toLowerCase();
    return workspace.orders.filter(
      (o) =>
        (!o.closedTs || recentlyClosedIds.has(o.id)) &&
        (!q || o.code.toLowerCase().includes(q) || o.tableName.toLowerCase().includes(q)),
    );
  }, [workspace.orders, debouncedQuery, recentlyClosedIds]);

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
            placeholder={t("staff.orders.search")}
            aria-label={t("staff.orders.search")}
            className="pl-9"
          />
        </div>
        <div className="hidden flex-1 sm:block" />
        {/* <Button size="sm" onClick={startCreate}>
          <Plus size={14} weight="bold" />
          {t("staff.orders.new")}
        </Button> */}
      </div>

      {open.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{t("staff.orders.none")}</p>
      ) : (
        // The rail of kitchen tickets: one paper ticket per open order.
        <ul className="grid grid-cols-1 items-start gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {open.map((order) => {
            const i = flow.indexOf(order.status);
            const canAdvance = i > -1 && i < flow.length - 1;
            // Not started yet: a saffron strip, like the new ticket on the landing rail.
            const isNew = i === 0;
            return (
              <li
                key={order.id}
                aria-label={t("staff.orders.ticketLabel", { table: order.tableName, code: order.code, status: statusLabel(t, order.status) })}
                className={cn(
                  "ticket-torn border-x border-t bg-white px-5 pt-4 pb-7 shadow-[0_10px_20px_-14px_rgb(21_32_45/0.4)]",
                  isNew ? "border-t-4 border-t-[#f0b232]" : "",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-2xl font-extrabold">{order.tableName}</span>
                  <time className="shrink-0 text-sm font-semibold text-muted-foreground" dateTime={new Date(order.ts).toISOString()}>
                    {t("staff.orders.opened", { time: hhmm(order.ts) })}
                  </time>
                </div>
                <div className="mt-1 flex items-center gap-2.5">
                  <span className="text-[13px] font-semibold text-muted-foreground">{order.code}</span>
                  <Badge className={orderTone(order.status, flow)}>{statusLabel(t, order.status)}</Badge>
                </div>

                <div className="mt-3 space-y-1.5 border-t border-dashed border-foreground/40 pt-3">
                  {order.lines.map((line) => (
                    <div key={line.id ?? line.itemId} className="flex items-baseline gap-2.5 text-[15px]">
                      <span className="w-7 font-extrabold">{line.qty}×</span>
                      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                        {line.name}
                        {line.note && (
                          <span className="block text-[13px] text-muted-foreground">{line.note}</span>
                        )}
                      </span>
                      <span className="text-sm text-muted-foreground tabular-nums">{fmt(line.price * line.qty)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-foreground/40 pt-3">
                  <span className="text-sm font-semibold">{t("staff.orders.total")}</span>
                  <span className="text-lg font-bold tabular-nums">{fmt(order.total)}</span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
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
                        run(`advance-${order.id}`, () => advanceOrder(order.id), t("staff.orders.updateFailed"));
                      }}
                    >
                      {statusLabel(t, flow[i + 1])}
                      <ArrowRight size={12} weight="bold" aria-hidden />
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
                    {t("staff.orders.modify")}
                  </Button>
                  <span className="flex-1" />
                  <button
                    type="button"
                    disabled={isPending(`delete-${order.id}`)}
                    onClick={() =>
                      run(`delete-${order.id}`, () => deleteOrder(order.id), t("staff.orders.deleteFailed"))
                    }
                    className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                    aria-label={t("staff.orders.deleteName", { code: order.code })}
                  >
                    <Trash size={15} weight="bold" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("staff.orders.modifyTitle", { code: editing.code, table: editing.tableName }) : ""}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                {editing.lines.map((line) => (
                  <div
                    key={line.id ?? line.itemId}
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
                        aria-label={t("staff.orders.decrease", { name: line.name })}
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
                        className="flex size-6.5 items-center justify-center rounded-full bg-brand-700 text-white disabled:pointer-events-none disabled:opacity-50"
                        aria-label={t("staff.orders.increase", { name: line.name })}
                      >
                        +
                      </button>
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2.5">
                <Select value={addDishId} onValueChange={setAddDishId}>
                  <SelectTrigger className="flex-1" aria-label={t("staff.orders.addDish")}>
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
                  {t("staff.orders.addItem")}
                </Button>
              </div>

              <div className="flex items-center justify-between border-t pt-3.5">
                <span className="text-sm font-semibold">{t("staff.orders.orderTotal")}</span>
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
                  const ok = await run(`delete-${editing.id}`, () => deleteOrder(editing.id), t("staff.orders.deleteFailed"));
                  if (ok) setEditId(null);
                }}
              >
                {t("staff.orders.deleteOrder")}
              </Button>
            )}
            <Button onClick={() => setEditId(null)}>{t("staff.orders.done")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!serving} onOpenChange={(o) => !o && setServingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {serving ? t("staff.orders.confirmTitle", { code: serving.code, table: serving.tableName }) : ""}
            </DialogTitle>
          </DialogHeader>
          {serving && (
            <div className="space-y-1">
              <p className="mb-2 text-[13px] text-muted-foreground">
                {t("staff.orders.checkOff")}
              </p>
              {serving.lines.map((line) => {
                const checked = checkedItems.has(line.itemId);
                return (
                  <label
                    key={line.id ?? line.itemId}
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
              {t("staff.orders.cancel")}
            </Button>
            <Button
              disabled={!allChecked}
              loading={!!serving && isPending(`advance-${serving.id}`)}
              onClick={async () => {
                if (!serving) return;
                const ok = await run(
                  `advance-${serving.id}`,
                  () => advanceOrder(serving.id),
                  t("staff.orders.updateFailed"),
                );
                if (ok) setServingId(null);
              }}
            >
              {serving ? statusLabel(t, flow[flow.indexOf(serving.status) + 1]) : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("staff.orders.new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="staff-orders-panel-table">{t("staff.orders.table")}</Label>
              <Select
                value={form.tableName}
                onValueChange={(tableName) => setForm((f) => ({ ...f, tableName }))}
              >
                <SelectTrigger id="staff-orders-panel-table" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {workspace.tables.map((table) => (
                    <SelectItem key={table.id} value={table.name}>
                      {table.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-orders-panel-dish">{t("staff.orders.dish")}</Label>
              <Select
                value={form.itemId}
                onValueChange={(itemId) => setForm((f) => ({ ...f, itemId }))}
              >
                <SelectTrigger id="staff-orders-panel-dish" className="w-full">
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
              <RequiredLabel htmlFor="staff-order-qty">{t("staff.orders.quantity")}</RequiredLabel>
              <Input
                id="staff-order-qty"
                type="number"
                min={1}
                step={1}
                required
                value={form.qty}
                onKeyDown={blockInvalidNumberKeys({ whole: true })}
                onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                {...fieldErrorProps("staff-order-qty", qtyError)}
                onBlur={() => setQtyError(countError(form.qty, "quantity"))}
              />
              <FieldError id="staff-order-qty" message={qtyError} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t("staff.orders.cancel")}
            </Button>
            <Button
              loading={isPending("create-order")}
              onClick={async () => {
                const qtyProblem = countError(form.qty, "quantity");
                setQtyError(qtyProblem);
                if (qtyProblem) return;
                if (!form.tableName || !form.itemId) return;
                const ok = await run("create-order", () =>
                  addOrder({
                    tableName: form.tableName,
                    itemId: form.itemId,
                    qty: Number(form.qty),
                  }), undefined, savedMessage()
                );
                if (ok) setCreateOpen(false);
              }}
            >
              {t("staff.orders.open")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
