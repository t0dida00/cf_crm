"use client";

import { t } from "@/lib/i18n";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ChartPlan, SeriesPoint } from "@/lib/chartBuckets";
import { errorMessage, toRequestStatus } from "@/lib/requestStatus";

/** Orders and takings per chart bucket (`GET /orders/stats/series`), bucketed
 * in the viewer's time zone. Disabled (idle) when the range has no chart. */
export function useOrderSeries(plan: ChartPlan | null) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const result = useQuery({
    queryKey: ["orders", "series", { bucket: plan?.bucket, from: plan?.from, to: plan?.to, tz }],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        bucket: plan!.bucket,
        from: String(plan!.from),
        to: String(plan!.to),
        tz,
      });
      const res = await apiFetch<{ series: SeriesPoint[] }>(`/orders/stats/series?${params}`, { signal });
      return res.series;
    },
    enabled: plan !== null,
    placeholderData: keepPreviousData,
  });

  return {
    series: result.data ?? [],
    status: result.isFetching ? ("loading" as const) : toRequestStatus(result),
    error: result.isError ? errorMessage(result.error, t("errors.chart")) : null,
    retry: () => void result.refetch(),
  };
}
