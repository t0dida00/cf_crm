---
paths:
  - "components/panels/dashboard-panel*"
  - "components/takings-chart*"
  - "lib/chart-buckets*"
  - "hooks/use-order-stats*"
  - "hooks/use-order-series*"
---

# Dashboard

- **Dashboard chart.** Chart.js via `react-chartjs-2` (`components/takings-chart.tsx`). `lib/chart-buckets.ts` maps the range to buckets: today → hours, last 7 days → weekdays, this month → days, this year → months, all time → years from the oldest order, none for custom. Bucketing uses the viewer's time zone (`GET /orders/stats/series?tz=`). Bars use brand-600 (`#1e90cc`) because brand-500 is under 3:1 contrast on white.
