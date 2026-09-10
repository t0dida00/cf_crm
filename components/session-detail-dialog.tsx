"use client";

import { useMemo, useState } from "react";
import { Printer } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BillReceipt, PrintableBillReceipt } from "@/components/bill-receipt";
import { useWorkspace } from "@/components/workspace-provider";
import { formatStamp } from "@/lib/range";
import { orderTone } from "@/lib/tone";
import type { OrderSession } from "@/lib/order-math";

export function SessionDetailDialog({
  session,
  onClose,
}: {
  session: OrderSession | null;
  onClose: () => void;
}) {
  const { workspace, flow, fmt } = useWorkspace();
  const { specialTaxes } = workspace.settings;
  const [billOpen, setBillOpen] = useState(false);

  const breakdown = useMemo(() => {
    if (!session) return null;
    const extras: Record<string, number> = {};
    let net = 0;
    session.orders.forEach((order) => {
      const taxRate = order.taxRate;
      net += order.total / (1 + taxRate / 100);
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
    });
    const commonTax = session.total - net - Object.values(extras).reduce((a, b) => a + b, 0);
    return {
      net,
      lines: [
        { label: "Common tax", amount: commonTax },
        ...Object.entries(extras).map(([label, amount]) => ({ label, amount })),
      ],
    };
  }, [session, specialTaxes, workspace.dishes]);

  if (!session || !breakdown) return null;
  const multi = session.orders.length > 1;
  const tableName = session.orders[0].tableName;
  const tax = session.total - breakdown.net;

  return (
    <>
      <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {multi ? `${session.orders.length} orders — ${tableName}` : session.orders[0].code}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-6 border-b pb-3.5 text-sm text-muted-foreground">
            <span>{tableName}</span>
            <span>{formatStamp(session.ts)}</span>
            <span className="flex-1" />
            {!multi && (
              <Badge className={orderTone(session.orders[0].status, flow)}>
                {session.orders[0].status}
              </Badge>
            )}
          </div>

          {session.orders.map((order) => (
            <div key={order.id} className="border-b py-3 last:border-0">
              {multi && (
                <div className="mb-1.5 flex items-center gap-2.5">
                  <span className="text-sm font-bold">{order.code}</span>
                  <span className="text-[13px] text-muted-foreground">
                    {formatStamp(order.ts)}
                  </span>
                  <span className="flex-1" />
                  <Badge className={orderTone(order.status, flow)}>{order.status}</Badge>
                </div>
              )}
              {order.lines.map((line) => (
                <div key={line.itemId} className="flex items-center gap-4 py-1.5 text-sm">
                  <span className="w-9 font-bold text-muted-foreground">{line.qty}×</span>
                  <span className="flex-1">
                    {line.name}
                    {line.note && (
                      <span className="block text-[13px] text-muted-foreground">
                        {line.note}
                      </span>
                    )}
                  </span>
                  <span className="text-muted-foreground">{fmt(line.price)}</span>
                  <span className="w-20 text-right font-semibold">
                    {fmt(line.price * line.qty)}
                  </span>
                </div>
              ))}
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
            <span className="text-sm font-semibold">{multi ? "Combined total" : "Total"}</span>
            <span className="text-xl font-bold">{fmt(session.total)}</span>
          </div>

          <div className="mt-1 flex justify-end">
            <Button
              onClick={() => setBillOpen(true)}
              style={{ backgroundColor: "#232F3F", color: "#FFF" }}
            >
              <Printer size={15} weight="bold" />
              Print bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={billOpen} onOpenChange={setBillOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bill — {tableName}</DialogTitle>
          </DialogHeader>
          <div>
            <BillReceipt
              workspaceName={workspace.name}
              workspaceAddress={workspace.address}
              workspacePhone={workspace.phone}
              tableName={tableName}
              orders={session.orders}
              net={breakdown.net}
              tax={tax}
              total={session.total}
              fmt={fmt}
            />
            <div className="mt-5 flex items-center gap-2.5">
              <Button variant="secondary" onClick={() => setBillOpen(false)}>
                Back
              </Button>
              <Button
                onClick={() => window.print()}
                style={{ backgroundColor: "#232F3F", color: "#FFF" }}
              >
                <Printer size={15} weight="bold" />
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {billOpen && (
        <div id="bill-print-area" className="hidden">
          <PrintableBillReceipt
            workspaceName={workspace.name}
            workspaceAddress={workspace.address}
            workspacePhone={workspace.phone}
            tableName={tableName}
            orders={session.orders}
            net={breakdown.net}
            tax={tax}
            total={session.total}
            fmt={fmt}
          />
        </div>
      )}
    </>
  );
}
