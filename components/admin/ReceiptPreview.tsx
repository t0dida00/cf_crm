import { money } from "@/lib/format";

export interface SampleLine {
  qty: number;
  name: string;
  price: number;
}

/** Stands in when the menu is empty, so the preview still reads like a bill. */
export const FALLBACK_LINES: SampleLine[] = [
  { qty: 2, name: "Flat white", price: 3.2 },
  { qty: 1, name: "Almond croissant", price: 3.6 },
];

/**
 * Net and tax for a bill whose prices already include `ratePct` (the common
 * tax is part of the price, as on the real bill).
 */
export function splitIncludedTax(total: number, ratePct: number): { net: number; tax: number } {
  const net = total / (1 + Math.max(ratePct, 0) / 100);
  return { net, tax: total - net };
}

/**
 * The settings as a guest's bill shows them, updated as the owner types: the
 * restaurant's name and contact at the top, then sample lines, the common tax
 * and the total in the chosen currency. Laid out like PrintableBillReceipt.
 */
export function ReceiptPreview({
  name,
  address,
  phone,
  taxRate,
  currency,
  lines,
}: {
  name: string;
  address: string;
  phone: string;
  taxRate: number;
  currency: string;
  lines: SampleLine[];
}) {
  const total = lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  const { net, tax } = splitIncludedTax(total, taxRate);
  const fmt = (v: number) => money(v, currency);

  return (
    <figure className="w-full">
      {/* A grey tray, so the white paper reads as paper on the white card. */}
      <div className="rounded-lg bg-secondary px-4 pt-4 pb-5">
      <div
        aria-label="Sample receipt"
        role="img"
        className="ticket-torn bg-white px-5 pt-5 pb-8 text-[13px] text-[#15202d] shadow-[0_14px_24px_-14px_rgb(21_32_45/0.45)]"
      >
        <div aria-hidden>
          <div className="text-center">
            <p className="text-base font-bold [overflow-wrap:anywhere]">{name.trim() || "Your restaurant"}</p>
            {address.trim() && <p className="[overflow-wrap:anywhere]">{address}</p>}
            {phone.trim() && <p>{phone}</p>}
          </div>
          <div className="my-3 border-t border-dashed border-[#15202d]" />
          {lines.map((l) => (
            <div key={l.name} className="flex justify-between gap-3 py-0.5">
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {l.qty}× {l.name}
              </span>
              <span className="tabular-nums">{fmt(l.qty * l.price)}</span>
            </div>
          ))}
          <div className="my-3 border-t border-dashed border-[#15202d]" />
          <div className="flex justify-between">
            <span>Net</span>
            <span className="tabular-nums">{fmt(net)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax ({Math.max(taxRate, 0)}%)</span>
            <span className="tabular-nums">{fmt(tax)}</span>
          </div>
          <div className="my-3 border-t border-dashed border-[#15202d]" />
          <div className="flex justify-between text-base font-bold">
            <span>Total due</span>
            <span className="tabular-nums">{fmt(total)}</span>
          </div>
        </div>
      </div>
      </div>
      <figcaption className="mt-3 text-[13px] text-muted-foreground text-pretty">
        How a bill looks with these settings: the common tax is included in each price, so a{" "}
        {fmt(total)} bill carries {fmt(tax)} of tax.
      </figcaption>
    </figure>
  );
}
