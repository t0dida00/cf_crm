"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PaginationBar } from "@/components/common/PaginationBar";
import { ErrorState, LoadingState } from "@/components/common/RequestState";
import { cn } from "@/lib/utils";
import { SessionDetailDialog } from "@/components/orders/SessionDetailDialog";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { summariseLines, type OrderSession } from "@/lib/orderMath";
import { orderTone } from "@/lib/tone";
import { daysAgoStart, formatStamp } from "@/lib/range";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useOrderHistory } from "@/hooks/useOrderHistory";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { statusLabel } from "@/lib/i18n/labels";

const PAGE_SIZE = 20;
/** Staff only see recent history: today and yesterday (by checkout time). The
 * sidebar count uses the same window. */
export const HISTORY_DAYS = 2;

const sessionLabel = (t: TFunction, s: OrderSession) =>
  s.orders.length > 1 ? t("staff.history.multiple", { n: s.orders.length }) : s.orders[0].code;

export function StaffHistoryPanel() {
  const { flow, fmt } = useWorkspace();
  const { t } = useTranslation();
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
          placeholder={t("staff.history.search")}
          aria-label={t("staff.history.search")}
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="overflow-x-auto px-0">
          <div className="min-w-[670px]">
            <div className="grid grid-cols-[140px_120px_minmax(200px,1fr)_110px_170px_110px] items-center gap-3 border-b bg-secondary py-3 pr-5 text-[13px] font-semibold text-muted-foreground">
              <span className="sticky left-0 -my-3 bg-secondary py-3 pl-5">{t("admin.orders.columns.session")}</span>
              <span className="bg-secondary">{t("admin.orders.columns.table")}</span>
              <span className="bg-secondary">{t("admin.orders.columns.items")}</span>
              <span className="bg-secondary">{t("admin.orders.columns.amount")}</span>
              <span className="bg-secondary">{t("admin.orders.columns.checkout")}</span>
              <span className="bg-secondary">{t("admin.orders.columns.status")}</span>
            </div>
            {status === "error" ? (
              <ErrorState message={error ?? undefined} onRetry={retry} />
            ) : history.length === 0 && (status === "loading" || status === "idle") ? (
              <LoadingState />
            ) : history.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {debouncedQuery ? t("staff.history.noMatch") : t("staff.history.none")}
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
                    {sessionLabel(t, s)}
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
                    {statusLabel(t, s.orders[0].status)}
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
