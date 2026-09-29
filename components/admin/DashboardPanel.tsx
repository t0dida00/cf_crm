"use client";

import { useTranslation } from "react-i18next";
import { isLocale } from "@/lib/i18n/config";
import { useMemo, useState } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CalendarBlank } from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { DataTable } from "@/components/common/DataTable";
import { SessionDetailDialog } from "@/components/orders/SessionDetailDialog";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { toSession, type OrderSession } from "@/lib/orderMath";
import { RANGES, rangeBounds, rangeCaption, formatStamp, type RangeState } from "@/lib/range";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { useOrderStats } from "@/hooks/useOrderStats";
import { ErrorState, LoadingState } from "@/components/common/RequestState";
import { TakingsChart } from "./TakingsChart";
import { BestSellers } from "./BestSellers";
import { useOrderSeries } from "@/hooks/useOrderSeries";
import { chartPlan } from "@/lib/chartBuckets";

interface DashOrder {
  order: Order;
  items: number;
}
const dashHelper = createColumnHelper<DashOrder>();

export function DashboardPanel() {
  const { t, i18n } = useTranslation();
  const { workspace, fmt, currency } = useWorkspace();
  const [range, setRange] = useState<RangeState>({ id: "month", from: "", to: "" });
  const [detail, setDetail] = useState<OrderSession | null>(null);

  const [lo, hi] = rangeBounds(range);
  // Order figures are aggregated by the backend over the full history — the
  // workspace's own order list only holds recent orders.
  const {
    stats: orderStats,
    status: statsStatus,
    error: statsError,
    retry: retryStats,
  } = useOrderStats(lo, hi);
  // Until the first response arrives there are no figures to show — render a
  // placeholder rather than a misleading 0.
  const statsPending = statsStatus === "loading" && orderStats.oldestTs === null;
  const figure = (value: string) => (statsPending || statsStatus === "error" ? "—" : value);
  // Recomputed per render, but only changes when the range (or the day, or the
  // oldest order for "All time") does.
  const plan = useMemo(
    () => chartPlan(range.id, new Date(), orderStats.oldestTs, isLocale(i18n.language) ? i18n.language : "en"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range.id, lo, orderStats.oldestTs, i18n.language],
  );
  const {
    series,
    status: seriesStatus,
    error: seriesError,
    retry: retrySeries,
  } = useOrderSeries(plan);
  const chartTitle = plan
    ? t(`admin.dashboard.chart.${plan.bucket}`)
    : "";
  const chartEmpty = seriesStatus === "success" && series.length === 0;

  const bookingsInRange = workspace.bookings.filter((b) => b.ts >= lo && b.ts <= hi);
  const { orderCount, takings } = orderStats;
  const oldest = orderStats.oldestTs ?? Date.now();

  const dashRows = useMemo<DashOrder[]>(
    () =>
      orderStats.recent.map((order) => ({
        order,
        items: order.lines.reduce((a, l) => a + l.qty, 0),
      })),
    [orderStats.recent],
  );

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
          header: t("admin.dashboard.columns.items"),
          cell: (c) => t("admin.dashboard.items", { count: c.getValue(), n: formatNumber(c.getValue()) }),
        }),
        dashHelper.accessor((r) => r.order.total, {
          id: "total",
          header: t("admin.dashboard.columns.amount"),
          cell: (c) => <span className="font-semibold">{fmt(c.getValue())}</span>,
          size: 110,
        }),
        dashHelper.accessor((r) => r.order.ts, {
          id: "ts",
          header: t("admin.dashboard.columns.checkout"),
          cell: (c) => (
            <span className="text-muted-foreground">{formatStamp(c.getValue())}</span>
          ),
          size: 160,
        }),
      ],
      [fmt, t],
    ),
    getCoreRowModel: getCoreRowModel(),
  });

  const guests = bookingsInRange.reduce((a, b) => a + b.party, 0);
  // One line under the takings figure: what it's made of, plus the bookings.
  const figures = [
    t("admin.dashboard.orders", { count: orderCount, n: figure(formatNumber(orderCount)) }),
    t("admin.dashboard.average", { amount: figure(orderCount ? fmt(takings / orderCount) : fmt(0)) }),
    `${t("admin.dashboard.bookings", { count: bookingsInRange.length, n: formatNumber(bookingsInRange.length) })}, ${t(
      "admin.dashboard.guests",
      { count: guests, n: formatNumber(guests) },
    )}`,
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange((s) => ({ ...s, id: r.id }))}
              aria-pressed={range.id === r.id}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[13px] transition-colors",
                range.id === r.id
                  ? "border-brand-700 bg-brand-700 font-bold text-white"
                  : "bg-card font-medium text-muted-foreground hover:bg-secondary",
              )}
            >
              {t(`range.${r.id}`)}
            </button>
          ))}
        </div>
        {range.id === "custom" && (
          <span className="inline-flex items-center gap-2">
            <Input
              type="date"
              aria-label={t("admin.dashboard.fromDate")}
              value={range.from}
              onChange={(e) => setRange((s) => ({ ...s, from: e.target.value }))}
              className="h-8.5 w-auto text-[13px]"
            />
            <span className="text-[13px] text-muted-foreground">{t("admin.dashboard.to")}</span>
            <Input
              type="date"
              aria-label={t("admin.dashboard.toDate")}
              value={range.to}
              onChange={(e) => setRange((s) => ({ ...s, to: e.target.value }))}
              className="h-8.5 w-auto text-[13px]"
            />
          </span>
        )}
        <p className="flex items-center gap-2 text-[13px] text-muted-foreground lg:ml-auto">
          <CalendarBlank size={14} weight="bold" aria-hidden />
          {rangeCaption(t, range, oldest)}
        </p>
      </div>

      {/* Takings lead the page: the figure, what it's made of, then how it built up. */}
      <Card className="gap-0 py-0">
        <section aria-labelledby="takings-title" className="px-6 pt-6 pb-5 sm:px-8 sm:pt-7">
          <h2 id="takings-title" className="font-semibold text-muted-foreground">
            {t(`admin.dashboard.heading.${range.id}`)}
          </h2>
          {statsStatus === "error" ? (
            <ErrorState message={statsError ?? undefined} onRetry={retryStats} className="items-start py-4 text-left" />
          ) : (
            <>
              <p className="mt-1 text-[clamp(2.25rem,6vw,3.75rem)] leading-[1.05] font-bold [overflow-wrap:anywhere]">
                {figure(fmt(takings))}
              </p>
              <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                {figures.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </>
          )}
        </section>

        {plan && (
          <section aria-labelledby="chart-title" className="border-t px-4 pt-5 pb-5 sm:px-6">
            <h3 id="chart-title" className="px-2 text-sm font-semibold">
              {chartTitle}
            </h3>
            <div className="mt-3">
              {seriesStatus === "error" ? (
                <ErrorState message={seriesError ?? undefined} onRetry={retrySeries} className="h-64 py-0" />
              ) : seriesStatus !== "success" && series.length === 0 ? (
                <LoadingState className="h-64 py-0" />
              ) : chartEmpty ? (
                <p className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  {t("admin.dashboard.noOrders")}
                </p>
              ) : (
                <TakingsChart slots={plan.slots} series={series} currency={currency} fmt={fmt} />
              )}
            </div>
          </section>
        )}
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>
              <h2>{t("admin.dashboard.latest")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <DataTable
              table={dashTable}
              minWidth={480}
              emptyMessage={t("admin.dashboard.noOrders")}
              status={statsStatus}
              error={statsError}
              onRetry={retryStats}
              onRowClick={(row) => setDetail(toSession([row.order]))}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t("admin.dashboard.bestSellers")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BestSellers
              items={orderStats.bestsellers}
              fmt={fmt}
              status={statsStatus}
              pending={statsPending}
              error={statsError}
              onRetry={retryStats}
            />
          </CardContent>
        </Card>
      </div>

      <SessionDetailDialog session={detail} onClose={() => setDetail(null)} />
    </div>
  );
}
