import { ErrorState, LoadingState } from "@/components/common/RequestState";
import type { OrderStats } from "@/hooks/useOrderStats";
import { formatNumber } from "@/lib/format";
import type { RequestStatus } from "@/lib/requestStatus";

/**
 * The range's top sellers by takings, each with a bar scaled to the leader so
 * the gap between dishes shows at a glance. Brand-600 (#1e90cc) for the bars,
 * like the chart: brand-500 is under 3:1 on white.
 */
export function BestSellers({
  items,
  fmt,
  status,
  pending,
  error,
  onRetry,
}: {
  items: OrderStats["bestsellers"];
  fmt: (value: number) => string;
  status: RequestStatus;
  pending: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (status === "error") return <ErrorState message={error ?? undefined} onRetry={onRetry} className="py-6" />;
  if (pending) return <LoadingState className="py-6" />;
  if (!items.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Nothing sold in this range.</p>;
  }
  const top = Math.max(...items.map((b) => b.takings), 1);
  return (
    <ol className="space-y-4">
      {items.map((b) => (
        <li key={b.itemId}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-semibold">{b.name}</span>
            <span className="shrink-0 font-semibold tabular-nums">{fmt(b.takings)}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-secondary" aria-hidden>
              <div
                className="h-full rounded-full bg-[#1e90cc]"
                style={{ width: `${Math.max((b.takings / top) * 100, 1)}%` }}
              />
            </div>
            <span className="w-24 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
              {formatNumber(b.qty)} sold
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
