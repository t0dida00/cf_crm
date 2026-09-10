"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SessionDetailDialog } from "@/components/session-detail-dialog";
import { useWorkspace } from "@/components/workspace-provider";
import { groupIntoSessions, summariseLines, type OrderSession } from "@/lib/order-math";
import { orderTone } from "@/lib/tone";
import { formatStamp } from "@/lib/range";

const sessionLabel = (s: OrderSession) =>
  s.orders.length > 1 ? `${s.orders.length} orders` : s.orders[0].code;

export function StaffHistoryPanel() {
  const { workspace, flow, fmt } = useWorkspace();
  const [query, setQuery] = useState("");
  const [session, setSession] = useState<OrderSession | null>(null);

  const history = useMemo(() => {
    const q = query.toLowerCase();
    const closed = workspace.orders.filter((o) => o.closedTs);
    return groupIntoSessions(closed).filter(
      (s) =>
        !q ||
        s.orders.some(
          (o) => o.code.toLowerCase().includes(q) || o.tableName.toLowerCase().includes(q),
        ),
    );
  }, [workspace.orders, query]);

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
            {history.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nothing checked out yet.
              </p>
            ) : (
              history.map((s) => (
                <button
                  key={s.orders[0].sessionId ?? s.orders[0].id}
                  type="button"
                  onClick={() => setSession(s)}
                  className="group grid w-full grid-cols-[140px_120px_minmax(200px,1fr)_110px_170px_110px] items-start gap-3 border-b py-3 pr-5 text-left text-sm transition-colors last:border-0 hover:bg-secondary"
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
      </Card>

      <SessionDetailDialog session={session} onClose={() => setSession(null)} />
    </>
  );
}
