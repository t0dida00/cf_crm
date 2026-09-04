"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CalendarBlank, CalendarCheck, CurrencyCircleDollar, Receipt } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table";
import { OrderDetailDialog } from "@/components/order-detail-dialog";
import { useWorkspace } from "@/components/workspace-provider";
import { RANGES, rangeBounds, rangeCaption, formatStamp, type RangeState } from "@/lib/range";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DashOrder {
  order: Order;
  items: number;
}
interface Bestseller {
  rank: number;
  name: string;
  qty: number;
  takings: number;
}

const dashHelper = createColumnHelper<DashOrder>();
const bestHelper = createColumnHelper<Bestseller>();

export function DashboardPanel() {
  const { workspace, fmt } = useWorkspace();
  const [range, setRange] = useState<RangeState>({ id: "month", from: "", to: "" });
  const [detail, setDetail] = useState<Order | null>(null);

  const [lo, hi] = rangeBounds(range);
  const inRange = useMemo(
    () => workspace.orders.filter((o) => o.ts >= lo && o.ts <= hi),
    [workspace.orders, lo, hi],
  );
  const bookingsInRange = workspace.bookings.filter((b) => b.ts >= lo && b.ts <= hi);
  const takings = inRange.reduce((a, o) => a + o.total, 0);
  const rangeLabel = RANGES.find((r) => r.id === range.id)?.label ?? "";
  const oldest = workspace.orders.length
    ? Math.min(...workspace.orders.map((o) => o.ts))
    : Date.now();

  const dashRows = useMemo<DashOrder[]>(
    () =>
      inRange.slice(0, 8).map((order) => ({
        order,
        items: order.lines.reduce((a, l) => a + l.qty, 0),
      })),
    [inRange],
  );

  const bestsellers = useMemo<Bestseller[]>(() => {
    const agg: Record<string, { name: string; qty: number; takings: number }> = {};
    inRange.forEach((o) =>
      o.lines.forEach((l) => {
        const entry = (agg[l.itemId] ??= { name: l.name, qty: 0, takings: 0 });
        entry.qty += l.qty;
        entry.takings += l.qty * l.price;
      }),
    );
    return Object.values(agg)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)
      .map((b, i) => ({ rank: i + 1, ...b }));
  }, [inRange]);

  const dashTable = useReactTable({
    data: dashRows,
    columns: useMemo(
      () => [
        dashHelper.accessor((r) => r.order.code, {
          id: "code",
          header: "#",
          cell: (c) => <span className="font-bold">{c.getValue()}</span>,
          size: 110,
        }),
        dashHelper.accessor("items", {
          header: "Items",
          cell: (c) => `${c.getValue()} ${c.getValue() === 1 ? "item" : "items"}`,
        }),
        dashHelper.accessor((r) => r.order.total, {
          id: "total",
          header: "Amount",
          cell: (c) => <span className="font-semibold">{fmt(c.getValue())}</span>,
          size: 110,
        }),
        dashHelper.accessor((r) => r.order.ts, {
          id: "ts",
          header: "Checkout time",
          cell: (c) => (
            <span className="text-muted-foreground">{formatStamp(c.getValue())}</span>
          ),
          size: 160,
        }),
      ],
      [fmt],
    ),
    getCoreRowModel: getCoreRowModel(),
  });

  const bestTable = useReactTable({
    data: bestsellers,
    columns: useMemo(
      () => [
        bestHelper.accessor("rank", {
          header: "#",
          cell: (c) => <span className="font-bold text-muted-foreground">{c.getValue()}</span>,
          size: 40,
        }),
        bestHelper.accessor("name", { header: "Name" }),
        bestHelper.accessor("qty", {
          header: () => <span className="block text-right">Orders</span>,
          cell: (c) => <span className="block text-right">{c.getValue()}</span>,
          size: 80,
        }),
        bestHelper.accessor("takings", {
          header: () => <span className="block text-right">Takings</span>,
          cell: (c) => (
            <span className="block text-right font-semibold">{fmt(c.getValue())}</span>
          ),
          size: 100,
        }),
      ],
      [fmt],
    ),
    getCoreRowModel: getCoreRowModel(),
  });

  const stats = [
    { Icon: Receipt, label: "ORDERS", value: String(inRange.length), hint: rangeLabel },
    {
      Icon: CalendarCheck,
      label: "BOOKINGS",
      value: String(bookingsInRange.length),
      hint: `${bookingsInRange.reduce((a, b) => a + b.party, 0)} guests · ${rangeLabel.toLowerCase()}`,
    },
    {
      Icon: CurrencyCircleDollar,
      label: "TAKINGS",
      value: fmt(takings),
      hint: inRange.length
        ? `Avg ${fmt(takings / inRange.length)} per order`
        : "No orders yet",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRange((s) => ({ ...s, id: r.id }))}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
              range.id === r.id
                ? "border-brand-500 bg-brand-500 font-bold text-white"
                : "bg-card font-medium text-muted-foreground hover:bg-secondary",
            )}
          >
            {r.label}
          </button>
        ))}
        {range.id === "custom" && (
          <span className="ml-1 inline-flex items-center gap-2">
            <Input
              type="date"
              value={range.from}
              onChange={(e) => setRange((s) => ({ ...s, from: e.target.value }))}
              className="h-8.5 w-auto text-[13px]"
            />
            <span className="text-[13px] text-muted-foreground">to</span>
            <Input
              type="date"
              value={range.to}
              onChange={(e) => setRange((s) => ({ ...s, to: e.target.value }))}
              className="h-8.5 w-auto text-[13px]"
            />
          </span>
        )}
      </div>

      <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
        <CalendarBlank size={14} weight="bold" />
        {rangeCaption(range, oldest)}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ Icon, label, value, hint }) => (
          <Card key={label}>
            <CardContent>
              <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground">
                <Icon size={14} weight="bold" />
                {label}
              </p>
              <p className="mt-2.5 text-3xl leading-none font-bold">{value}</p>
              <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Orders in Range</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <DataTable
              table={dashTable}
              minWidth={480}
              emptyMessage="No orders in this range."
              onRowClick={(row) => setDetail(row.order)}
            />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Top 5 Bestsellers</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <DataTable
              table={bestTable}
              emptyMessage="Nothing sold in this range."
            />
          </CardContent>
        </Card>
      </div>

      <OrderDetailDialog order={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
