"use client";

import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/components/workspace-provider";
import { formatStamp } from "@/lib/range";
import type { Order } from "@/lib/types";

const TONES = ["bg-sky-50 text-sky-700", "bg-amber-50 text-amber-700", "bg-brand-100 text-brand-600", "bg-green-50 text-green-700"];

export function OrderDetailDialog({
  order,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const { workspace, flow, fmt } = useWorkspace();
  const { taxRate, specialTaxes } = workspace.settings;

  const breakdown = useMemo(() => {
    if (!order) return null;
    const net = order.total / (1 + taxRate / 100);
    const extras: Record<string, number> = {};
    order.lines.forEach((line) => {
      const dish = workspace.dishes.find((d) => d.id === line.itemId);
      const tax =
        dish?.taxMode === "include"
          ? specialTaxes.find((t) => t.name === dish.taxName)
          : undefined;
      if (!tax) return;
      const base = (line.price * line.qty) / (1 + taxRate / 100);
      extras[tax.name] = (extras[tax.name] ?? 0) + (base * tax.pct) / 100;
    });
    return {
      net,
      lines: [
        { label: `Common tax (${taxRate}%)`, amount: (net * taxRate) / 100 },
        ...Object.entries(extras).map(([label, amount]) => ({ label, amount })),
      ],
    };
  }, [order, taxRate, specialTaxes, workspace.dishes]);

  if (!order || !breakdown) return null;
  const toneIndex = Math.max(0, flow.indexOf(order.status));

  return (
    <Dialog open={!!order} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{order.code}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-6 border-b pb-3.5 text-sm text-muted-foreground">
          <span>{order.tableName}</span>
          <span>{formatStamp(order.ts)}</span>
          <span className="flex-1" />
          <Badge className={TONES[toneIndex]}>{order.status}</Badge>
        </div>

        <div className="flex items-center gap-4 pt-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <span className="w-9">Qty</span>
          <span className="flex-1">Item</span>
          <span>Price</span>
          <span className="w-20 text-right">Total</span>
        </div>

        {order.lines.map((line) => (
          <div
            key={line.itemId}
            className="flex items-center gap-4 border-t py-3 text-sm"
          >
            <span className="w-9 font-bold text-muted-foreground">{line.qty}×</span>
            <span className="flex-1">
              {line.name}
              {line.note && (
                <span className="block text-[13px] text-muted-foreground">{line.note}</span>
              )}
            </span>
            <span className="text-muted-foreground">{fmt(line.price)}</span>
            <span className="w-20 text-right font-semibold">
              {fmt(line.price * line.qty)}
            </span>
          </div>
        ))}

        <div className="flex justify-between pt-3.5 text-sm text-muted-foreground">
          <span>Net</span>
          <span>{fmt(breakdown.net)}</span>
        </div>
        {breakdown.lines.map((line) => (
          <div
            key={line.label}
            className="flex justify-between pt-1.5 text-sm text-muted-foreground"
          >
            <span>{line.label}</span>
            <span>{fmt(line.amount)}</span>
          </div>
        ))}
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-xl font-bold">{fmt(order.total)}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
