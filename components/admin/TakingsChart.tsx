"use client";

import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { fillSlots, type ChartSlot, type SeriesPoint } from "@/lib/chartBuckets";
import { formatNumber, moneyCompact } from "@/lib/format";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

// brand-600 / brand-700: brand-500 (#2da8e5) is under 3:1 against the white card.
const BAR = "#1e90cc";
const BAR_HOVER = "#1b75a6";
const GRID = "#eef0f3";
const TICK = "#6b7280"; // --muted-foreground

/** Takings per bucket as a single-series bar chart; the card title names the
 * series, so there's no legend. Hovering anywhere over a column shows its
 * full label, takings and order count. */
export function TakingsChart({
  slots,
  series,
  currency,
  fmt,
}: {
  slots: ChartSlot[];
  series: SeriesPoint[];
  currency: string;
  fmt: (value: number) => string;
}) {
  const { t } = useTranslation();
  const points = useMemo(() => fillSlots(slots, series), [slots, series]);

  const fontFamily = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    const nunito = getComputedStyle(document.documentElement).getPropertyValue("--font-nunito").trim();
    return nunito ? `${nunito}, sans-serif` : undefined;
  }, []);

  const data = useMemo<ChartData<"bar">>(
    () => ({
      labels: points.map((p) => p.label),
      datasets: [
        {
          label: t("admin.dashboard.takings"),
          data: points.map((p) => p.takings),
          backgroundColor: BAR,
          hoverBackgroundColor: BAR_HOVER,
          borderRadius: { topLeft: 4, topRight: 4 },
          borderSkipped: "start",
          categoryPercentage: 0.8,
          barPercentage: 0.9,
          maxBarThickness: 48,
        },
      ],
    }),
    [points, t],
  );

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      // Hover the whole column, not just the bar — short bars stay easy to hit.
      interaction: { mode: "index", intersect: false },
      font: fontFamily ? { family: fontFamily } : undefined,
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          padding: 10,
          backgroundColor: "#111827",
          titleFont: { family: fontFamily, weight: "bold" },
          bodyFont: { family: fontFamily },
          callbacks: {
            title: (items) => points[items[0].dataIndex]?.title ?? "",
            label: (item) => {
              const p = points[item.dataIndex];
              return [t("admin.dashboard.tooltipTakings", { amount: fmt(p.takings) }), t("admin.dashboard.tooltipOrders", { n: formatNumber(p.orders) })];
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { color: GRID },
          ticks: { color: TICK, maxRotation: 0, autoSkipPadding: 8, font: { family: fontFamily, size: 12 } },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: GRID },
          ticks: {
            color: TICK,
            maxTicksLimit: 5,
            font: { family: fontFamily, size: 12 },
            callback: (value) => moneyCompact(Number(value), currency),
          },
        },
      },
    }),
    [points, fmt, currency, fontFamily, t],
  );

  return (
    <>
      <div className="relative h-64 w-full">
        <Bar data={data} options={options} aria-hidden="true" />
      </div>
      {/* sr-only goes on a wrapper: a <table> treats height as a minimum and grows
          to fit its rows, so on the table itself it would stretch the page. */}
      <div className="sr-only">
        <table>
          <caption>{t("admin.dashboard.tableCaption")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("admin.dashboard.period")}</th>
              <th scope="col">{t("admin.dashboard.takings")}</th>
              <th scope="col">{t("admin.dashboard.ordersHeader")}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.key}>
                <th scope="row">{p.title}</th>
                <td>{fmt(p.takings)}</td>
                <td>{formatNumber(p.orders)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
