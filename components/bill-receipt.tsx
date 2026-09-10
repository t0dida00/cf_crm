import { formatStamp } from "@/lib/range";
import type { Order } from "@/lib/types";

export interface BillReceiptProps {
  workspaceName: string;
  workspaceAddress?: string;
  workspacePhone?: string;
  tableName: string;
  orders: Order[];
  net: number;
  tax: number;
  total: number;
  fmt: (value: number) => string;
}

/** Plain-text, dashed-rule layout matching a till receipt — used only inside
 * #bill-print-area (see globals.scss's @media print block), which supplies
 * its own fixed-width monospace styling. Tailwind classes don't survive
 * print's own width/margins the way they do in the dialog, so this renders
 * with semantic bill-* class names instead. */
export function PrintableBillReceipt({
  workspaceName,
  workspaceAddress,
  workspacePhone,
  tableName,
  orders,
  net,
  tax,
  total,
  fmt,
}: BillReceiptProps) {
  return (
    <div>
      <div className="bill-center">
        <p className="bill-name">{workspaceName}</p>
        {workspaceAddress && <p>{workspaceAddress}</p>}
        {workspacePhone && <p>{workspacePhone}</p>}
      </div>

      <div className="bill-rule" />
      <div className="bill-row">
        <span>{tableName}</span>
        <span>{formatStamp(Date.now())}</span>
      </div>
      <div className="bill-rule" />

      {orders.map((o) => (
        <div key={o.id}>
          <div className="bill-row bill-muted">
            <span>{o.code}</span>
            <span>{formatStamp(o.ts)}</span>
          </div>
          {o.lines.map((l) => (
            <div key={l.itemId}>
              <div className="bill-row">
                <span className="bill-item-name">
                  {l.qty}× {l.name}
                </span>
                <span>{fmt(l.price * l.qty)}</span>
              </div>
              {l.note && <div className="bill-muted">{l.note}</div>}
            </div>
          ))}
          <div className="bill-rule" />
        </div>
      ))}

      <div className="bill-row bill-muted">
        <span>Net</span>
        <span>{fmt(net)}</span>
      </div>
      <div className="bill-row bill-muted">
        <span>Tax</span>
        <span>{fmt(tax)}</span>
      </div>
      <div className="bill-rule" />
      <div className="bill-total-row">
        <span>Total due</span>
        <span>{fmt(total)}</span>
      </div>
    </div>
  );
}

export function BillReceipt({
  workspaceName,
  workspaceAddress,
  workspacePhone,
  tableName,
  orders,
  net,
  tax,
  total,
  fmt,
}: BillReceiptProps) {
  return (
    <div>
      <div className="text-center">
        <p className="text-base font-bold">{workspaceName}</p>
        {workspaceAddress && (
          <p className="text-[13px] text-muted-foreground">{workspaceAddress}</p>
        )}
        {workspacePhone && (
          <p className="text-[13px] text-muted-foreground">{workspacePhone}</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-y py-2.5 text-[13px] text-muted-foreground">
        <span>{tableName}</span>
        <span>{formatStamp(Date.now())}</span>
      </div>

      {orders.map((o) => (
        <div key={o.id} className="border-b py-3 last:border-0">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-bold">{o.code}</span>
            <span className="flex-1" />
            <span className="text-[13px] text-muted-foreground">{formatStamp(o.ts)}</span>
          </div>
          {o.lines.map((l) => (
            <div key={l.itemId} className="flex items-baseline gap-2.5 py-1 text-sm">
              <span className="w-6.5 font-bold text-muted-foreground">{l.qty}×</span>
              <span className="flex-1">
                {l.name}
                {l.note && (
                  <span className="block text-[13px] text-muted-foreground">{l.note}</span>
                )}
              </span>
              <span className="text-muted-foreground">{fmt(l.price)}</span>
              <span className="w-16 text-right font-semibold">{fmt(l.price * l.qty)}</span>
            </div>
          ))}
        </div>
      ))}

      <div className="mt-1">
        <div className="flex justify-between pt-3.5 text-[13px] text-muted-foreground">
          <span>Net</span>
          <span>{fmt(net)}</span>
        </div>
        <div className="flex justify-between pt-1.5 text-[13px] text-muted-foreground">
          <span>Tax</span>
          <span>{fmt(tax)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-sm font-semibold">Total due</span>
          <span className="text-xl font-bold">{fmt(total)}</span>
        </div>
      </div>
    </div>
  );
}
