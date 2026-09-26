"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/pagination-bar";
import { ErrorState, LoadingState } from "@/components/request-state";
import { cn } from "@/lib/utils";
import { SessionDetailDialog } from "@/components/session-detail-dialog";
import { useWorkspace } from "@/components/workspace-provider";
import { summariseLines, type OrderSession } from "@/lib/order-math";
import { orderTone } from "@/lib/tone";
import { daysAgoStart, formatStamp } from "@/lib/range";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useOrderHistory } from "@/hooks/use-order-history";

const PAGE_SIZE = 20;
/** Staff only see recent history: today and yesterday. */
const HISTORY_DAYS = 2;

const sessionLabel = (s: OrderSession) =>
  s.orders.length > 1 ? `${s.orders.length} orders` : s.orders[0].code;

export function StaffHistoryPanel() {
  const { flow, fmt } = useWorkspace();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [session, setSession] = useState<OrderSession | null>(null);

  const [page, setPage] = useState(1);

  // A new search starts from the first page.
  useEffect(() => setPage(1), [debouncedQuery]);

  const { sessions: history, total, status, error, retry } = useOrderHistory({
    status: "closed",
    query: debouncedQuery,
    page,
    pageSize: PAGE_SIZE,
    // Same value all day, so the query key only changes at midnight.
    from: daysAgoStart(HISTORY_DAYS - 1),
  });

  return (
    <>
      <div className="relative mb-4 w-full sm:w-80">
        <MagnifyingGlass
          size={16}
          weight="bold"
          className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search session or order ID"
          aria-label="Search session or order ID"
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="overflow-x-auto px-0">
          <div className="min-w-[670px]">
            <div className="grid grid-cols-[140px_120px_minmax(200px,1fr)_110px_170px_110px] items-center gap-3 border-b bg-secondary py-3 pr-5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              <span className="sticky left-0 -my-3 bg-secondary py-3 pl-5">Session</span>
              <span className="bg-secondary">Table</span>
              <span className="bg-secondary">Items</span>
              <span className="bg-secondary">Amount</span>
              <span className="bg-secondary">Checkout time</span>
              <span className="bg-secondary">Status</span>
            </div>
            {status === "error" ? (
              <ErrorState message={error ?? undefined} onRetry={retry} />
            ) : history.length === 0 && (status === "loading" || status === "idle") ? (
              <LoadingState />
            ) : history.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {debouncedQuery ? "No orders match." : "Nothing checked out today or yesterday."}
              </p>
            ) : (
              history.map((s) => (
                <button
                  key={s.orders[0].sessionId ?? s.orders[0].id}
                  type="button"
                  onClick={() => setSession(s)}
                  className={cn(
                    "group grid w-full grid-cols-[140px_120px_minmax(200px,1fr)_110px_170px_110px] items-start gap-3 border-b py-3 pr-5 text-left text-sm transition-colors last:border-0 hover:bg-secondary",
                    status === "loading" && "opacity-60",
                  )}
                >
                  <span className="sticky left-0 -my-3 bg-card py-3 pl-5 font-bold group-hover:bg-secondary">
                    {sessionLabel(s)}
                  </span>
                  <span>{s.orders[0].tableName}</span>
                  <span className="text-wrap text-muted-foreground">
                    {summariseLines(s.orders.flatMap((o) => o.lines))
                      .map((l) => `${l.qty}× ${l.name}`)
                      .join(", ")}
                  </span>
                  <span className="font-semibold">{fmt(s.total)}</span>
                  <span className="text-muted-foreground">
                    {s.closedTs ? formatStamp(s.closedTs) : "—"}
                  </span>
                  <Badge className={orderTone(s.orders[0].status, flow)}>
                    {s.orders[0].status}
                  </Badge>
                </button>
              ))
            )}
          </div>
        </CardContent>
        <PaginationBar page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} noun="sessions" />
      </Card>

      <SessionDetailDialog session={session} onClose={() => setSession(null)} />
    </>
  );
}
