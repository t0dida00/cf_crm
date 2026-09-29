---
paths:
  - "components/admin/dashboard-panel*"
  - "components/takings-chart*"
  - "lib/chart-buckets*"
  - "hooks/use-order-stats*"
  - "hooks/use-order-series*"
---

# Dashboard

- **Dashboard chart.** Chart.js via `react-chartjs-2` (`components/admin/TakingsChart.tsx`). `lib/chartBuckets.ts` maps the range to buckets: today → hours, last 7 days → weekdays, this month → days, this year → months, all time → years from the oldest order, none for custom. Bucketing uses the viewer's time zone (`GET /orders/stats/series?tz=`). Bars use brand-600 (`#1e90cc`) because brand-500 is under 3:1 contrast on white.
- **Layout.** Takings lead the page: one block with the range's takings as the only large figure (`admin.dashboard.heading.<range>` in the locale files names the period), a single line of orders, average order and bookings under it, then the chart. No row of stat cards. Best sellers are bars scaled to the top seller's takings (`BestSellers`, same brand-600), not a table. While the first figures load they show "—", never 0.
