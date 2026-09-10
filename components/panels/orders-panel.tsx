"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  CaretLeft,
  CaretRight,
  DownloadSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react";
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
import { DataTable } from "@/components/data-table";
import { SessionDetailDialog } from "@/components/session-detail-dialog";
import { useWorkspace } from "@/components/workspace-provider";
import { useAsyncAction } from "@/hooks/use-async-action";
import { groupIntoSessions, summariseLines, type OrderSession } from "@/lib/order-math";
import { orderTone } from "@/lib/tone";
import { formatStamp } from "@/lib/range";
import type { Order } from "@/lib/types";

const helper = createColumnHelper<OrderSession>();

const summarise = (session: OrderSession) =>
  summariseLines(session.orders.flatMap((o) => o.lines))
    .map((l) => `${l.qty}× ${l.name}`)
    .join(", ");

const sessionRef = (session: OrderSession) =>
  session.orders.length > 1 ? `${session.orders.length} orders` : session.orders[0].code;

export function OrdersPanel({ createSignal }: { createSignal: number }) {
  const { workspace, flow, fmt, addOrder } = useWorkspace();
  const { run, isPending } = useAsyncAction();
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<OrderSession | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tableName: "", itemId: "", qty: "1" });

  useEffect(() => {
    if (createSignal > 0) {
      setForm({
        tableName: workspace.tables[0]?.name ?? "",
        itemId: workspace.dishes[0]?.id ?? "",
        qty: "1",
      });
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSignal]);

  const data = useMemo(() => {
    const q = query.toLowerCase();
    // Open orders stay as their own row — they have no checkout time yet, so
    // grouping them into a session ahead of time would be premature. Closed
    // orders collapse into their checkout session (possibly several orders
    // paid together in one go).
    const open = workspace.orders.filter((o) => !o.closedTs);
    const closed = workspace.orders.filter((o) => o.closedTs);
    const sessions = [...open.map((o) => ({ orders: [o], ts: o.ts, closedTs: null, total: o.total })), ...groupIntoSessions(closed)]
      .sort((a, b) => b.ts - a.ts);
    return sessions.filter(
      (s) =>
        !q ||
        s.orders.some(
          (o) => o.code.toLowerCase().includes(q) || o.tableName.toLowerCase().includes(q),
        ),
    );
  }, [workspace.orders, query]);

  const columns = useMemo(
    () => [
      helper.display({
        id: "ref",
        header: "#",
        cell: ({ row }) => <span className="font-bold">{sessionRef(row.original)}</span>,
        size: 110,
      }),
      helper.display({
        id: "table",
        header: "Table",
        cell: ({ row }) => row.original.orders[0].tableName,
        size: 120,
      }),
      helper.display({
        id: "items",
        header: "Items",
        cell: ({ row }) => (
          <span className="block max-w-[360px] text-wrap text-muted-foreground">
            {summarise(row.original)}
          </span>
        ),
      }),
      helper.accessor("total", {
        header: "Amount",
        cell: (c) => <span className="font-semibold">{fmt(c.getValue())}</span>,
        size: 110,
      }),
      helper.display({
        id: "checkoutTime",
        header: "Checkout time",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.closedTs ? formatStamp(row.original.closedTs) : "—"}
          </span>
        ),
        size: 160,
      }),
      helper.display({
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={orderTone(row.original.orders[0].status, flow)}>
            {row.original.orders[0].status}
          </Badge>
        ),
        size: 120,
      }),
    ],
    [flow, fmt],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;

  const exportCsv = () => {
    const rows = [
      ["Session", "Table", "Items", "Amount", "Checkout time", "Status"],
      ...data.map((s) => [
        sessionRef(s),
        s.orders[0].tableName,
        summarise(s),
        s.total.toFixed(2),
        s.closedTs ? formatStamp(s.closedTs) : "",
        s.orders[0].status,
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(workspace.name || "orders").replace(/\s+/g, "-").toLowerCase()}-orders.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-70">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by ref or table"
            aria-label="Search by ref or table"
            className="pl-9"
          />
        </div>
        <div className="flex-1" />
        <span className="text-[13px] text-muted-foreground">Rows</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => table.setPageSize(Number(v))}
        >
          <SelectTrigger className="w-20" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCsv}>
          <DownloadSimple size={15} weight="bold" />
          Export CSV
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="px-0">
          <DataTable
            table={table}
            minWidth={1040}
            emptyMessage="No orders match."
            onRowClick={setDetail}
          />
          <div className="flex items-center justify-between px-5 py-3.5">
            <span className="text-[13px] text-muted-foreground">
              {total
                ? `Showing ${pageIndex * pageSize + 1}–${Math.min(
                    (pageIndex + 1) * pageSize,
                    total,
                  )} of ${total} orders`
                : "No orders"}
            </span>
            <span className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                aria-label="Previous page"
              >
                <CaretLeft size={14} weight="bold" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                aria-label="Next page"
              >
                <CaretRight size={14} weight="bold" />
              </Button>
            </span>
          </div>
        </CardContent>
      </Card>

      <SessionDetailDialog session={detail} onClose={() => setDetail(null)} />

      <Dialog open={open} onOpenChange={setOpen}>
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
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="order-qty">Quantity</Label>
              <Input
                id="order-qty"
                type="number"
                value={form.qty}
                onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={isPending("create-order")}
              onClick={async () => {
                const ok = await run("create-order", () =>
                  addOrder({
                    tableName: form.tableName,
                    itemId: form.itemId,
                    qty: Number(form.qty) || 1,
                  }),
                );
                if (ok) setOpen(false);
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
