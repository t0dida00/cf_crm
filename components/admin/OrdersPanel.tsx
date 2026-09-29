"use client";

import { useEffect, useMemo, useState } from "react";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { DownloadSimple, MagnifyingGlass } from "@phosphor-icons/react";
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
import { blockInvalidNumberKeys, countError } from "@/lib/validation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { DataTable } from "@/components/common/DataTable";
import { PaginationBar } from "@/components/common/PaginationBar";
import { SessionDetailDialog } from "@/components/orders/SessionDetailDialog";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { SAVED_MESSAGE, useAsyncAction } from "@/hooks/useAsyncAction";
import { summariseLines, type OrderSession } from "@/lib/orderMath";
import { orderTone } from "@/lib/tone";
import { formatStamp } from "@/lib/range";
import { toCsv } from "@/lib/csv";
import { downloadFile } from "@/lib/downloadFile";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useOrderHistory } from "@/hooks/useOrderHistory";

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
  const debouncedQuery = useDebouncedValue(query, 300);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detail, setDetail] = useState<OrderSession | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ tableName: "", itemId: "", qty: "1" });
  const [qtyError, setQtyError] = useState<string | undefined>();

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

  // A new search starts from the first page.
  useEffect(() => setPage(1), [debouncedQuery]);

  // Open orders stay as their own row — they have no checkout time yet, so
  // grouping them into a session ahead of time would be premature. Closed
  // orders collapse into their checkout session (possibly several orders
  // paid together in one go). Grouping, search and paging run on the server.
  const { sessions: data, total, status, error, retry } = useOrderHistory({
    status: "all",
    query: debouncedQuery,
    page,
    pageSize,
  });

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
            {row.original.closedTs ? formatStamp(row.original.closedTs) : "Not checked out"}
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
  });

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
    // UTF-8 with a byte-order mark (downloadFile), so Excel keeps accented names.
    downloadFile(
      toCsv(rows.map((r) => r.map(String))),
      `${(workspace.name || "orders").replace(/\s+/g, "-").toLowerCase()}-orders-page-${page}.csv`,
    );
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
          onValueChange={(v) => {
            setPageSize(Number(v));
            setPage(1);
          }}
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
          Export page (CSV)
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="px-0">
          <DataTable
            table={table}
            minWidth={1040}
            emptyMessage={debouncedQuery ? "No orders match." : "No orders yet."}
            status={status}
            error={error}
            onRetry={retry}
            onRowClick={setDetail}
          />
          <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
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
              <Label htmlFor="orders-panel-table">Table</Label>
              <Select
                value={form.tableName}
                onValueChange={(tableName) => setForm((f) => ({ ...f, tableName }))}
              >
                <SelectTrigger id="orders-panel-table" className="w-full">
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
              <Label htmlFor="orders-panel-dish">Dish</Label>
              <Select
                value={form.itemId}
                onValueChange={(itemId) => setForm((f) => ({ ...f, itemId }))}
              >
                <SelectTrigger id="orders-panel-dish" className="w-full">
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
              <RequiredLabel htmlFor="order-qty">Quantity</RequiredLabel>
              <Input
                id="order-qty"
                type="number"
                min={1}
                step={1}
                required
                value={form.qty}
                onKeyDown={blockInvalidNumberKeys({ whole: true })}
                onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
                {...fieldErrorProps("order-qty", qtyError)}
                onBlur={() => setQtyError(countError(form.qty, "Quantity"))}
              />
              <FieldError id="order-qty" message={qtyError} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={isPending("create-order")}
              onClick={async () => {
                const qtyProblem = countError(form.qty, "Quantity");
                setQtyError(qtyProblem);
                if (qtyProblem) return;
                const ok = await run("create-order", () =>
                  addOrder({
                    tableName: form.tableName,
                    itemId: form.itemId,
                    qty: Number(form.qty),
                  }), undefined, SAVED_MESSAGE
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
