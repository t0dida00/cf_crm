"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/components/workspace-provider";
import { hhmm } from "@/lib/range";
import type { Order } from "@/lib/types";

export function StaffHistoryPanel() {
  const { workspace, fmt } = useWorkspace();
  const [query, setQuery] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);

  const history = useMemo(() => {
    const q = query.toLowerCase();
    return workspace.orders
      .filter(
        (o) =>
          o.closedTs &&
          (!q || o.code.toLowerCase().includes(q) || o.tableName.toLowerCase().includes(q)),
      )
      .sort((a, b) => (b.closedTs as number) - (a.closedTs as number));
  }, [workspace.orders, query]);

  const detail: Order | null = workspace.orders.find((o) => o.id === detailId) ?? null;
  const rate = workspace.settings.taxRate;
  const dTotal = detail?.total ?? 0;
  const dNet = dTotal / (1 + rate / 100);
  const dTax = dTotal - dNet;

  return (
    <>
      <div className="relative mb-4 w-80">
        <MagnifyingGlass
          size={16}
          weight="bold"
          className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order ID"
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden">
        <CardContent className="px-0">
          <div className="grid grid-cols-[120px_120px_minmax(200px,1fr)_110px_150px] gap-3 border-b bg-secondary px-5 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <span>#</span>
            <span>Table</span>
            <span>Items</span>
            <span>Total</span>
            <span>Checked out</span>
          </div>
          {history.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nothing checked out yet.
            </p>
          ) : (
            history.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setDetailId(o.id)}
                className="grid w-full grid-cols-[120px_120px_minmax(200px,1fr)_110px_150px] items-center gap-3 border-b px-5 py-3 text-left text-sm transition-colors last:border-0 hover:bg-secondary"
              >
                <span className="font-bold">{o.code}</span>
                <span>{o.tableName}</span>
                <span className="overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
                  {o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
                </span>
                <span className="font-semibold">{fmt(o.total)}</span>
                <span className="text-muted-foreground">{hhmm(o.closedTs as number)}</span>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetailId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{detail?.code}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div>
              <div className="flex gap-5 border-b pb-3.5 text-[13px] text-muted-foreground">
                <span>{detail.tableName}</span>
                <span>
                  Opened {hhmm(detail.ts)} · checked out {hhmm(detail.closedTs as number)}
                </span>
              </div>
              <div className="flex items-center gap-4 pt-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                <span className="w-8.5">Qty</span>
                <span className="flex-1">Item</span>
                <span>Price</span>
                <span className="w-20 text-right">Total</span>
              </div>
              {detail.lines.map((l) => (
                <div key={l.itemId} className="flex items-center gap-4 border-t py-3 text-sm">
                  <span className="w-8.5 font-bold text-muted-foreground">{l.qty}×</span>
                  <span className="flex-1">
                    {l.name}
                    {l.note && (
                      <span className="block text-[13px] text-muted-foreground">{l.note}</span>
                    )}
                  </span>
                  <span className="text-muted-foreground">{fmt(l.price)}</span>
                  <span className="w-20 text-right font-semibold">{fmt(l.price * l.qty)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-3.5 text-[13px] text-muted-foreground">
                <span>Net</span>
                <span>{fmt(dNet)}</span>
              </div>
              <div className="flex justify-between pt-1.5 text-[13px] text-muted-foreground">
                <span>Tax ({rate}%)</span>
                <span>{fmt(dTax)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-xl font-bold">{fmt(dTotal)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
