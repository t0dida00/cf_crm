/** Receipt (thermal) paper widths, in mm. */
export type PaperWidth = 80 | 58;
export const PAPER_WIDTHS: PaperWidth[] = [80, 58];

/** What each paper can print on (the printer head leaves a margin either side), and a font that fits. */
const PAPER: Record<PaperWidth, { contentMm: number; fontPx: number }> = {
  80: { contentMm: 72, fontPx: 12 },
  58: { contentMm: 48, fontPx: 10 },
};

const PAPER_KEY = "tably:receipt-paper";
const PX_PER_MM = 96 / 25.4;
/** Extra paper after the last line, so a printer's cutter doesn't clip the total. */
const FEED_MM = 6;

/** This device's receipt paper (a per-printer convenience, so per browser). Defaults to 80 mm. */
export function savedPaperWidth(): PaperWidth {
  try {
    return localStorage.getItem(PAPER_KEY) === "58" ? 58 : 80;
  } catch {
    return 80;
  }
}

export function savePaperWidth(width: PaperWidth) {
  try {
    localStorage.setItem(PAPER_KEY, String(width));
  } catch {
    // Not remembered; this print still uses it.
  }
}

/**
 * The whole print document for a receipt: `bodyHtml` laid out on paper
 * `width` mm wide, in black only (thermal printers can't print grey), with
 * the page exactly `heightMm` long when known, so it prints as one page the
 * length of the receipt instead of on A4.
 */
export function receiptDocument(bodyHtml: string, width: PaperWidth, heightMm?: number): string {
  const { contentMm, fontPx } = PAPER[width];
  const sideMm = (width - contentMm) / 2;
  // Without a measured height, an A4-long strip of the right width.
  const page = `${width}mm ${heightMm ? Math.ceil(heightMm) : 297}mm`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Receipt</title><style>
@page { size: ${page}; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${width}mm; background: #fff; }
body {
  padding: 3mm ${sideMm}mm ${FEED_MM}mm;
  font-family: "Courier New", Courier, monospace;
  font-size: ${fontPx}px;
  line-height: 1.4;
  color: #000;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.bill-center { text-align: center; }
.bill-name { font-size: 1.3em; font-weight: 700; }
.bill-rule { border-top: 1px dashed #000; margin: 2.5mm 0; }
.bill-row, .bill-total-row { display: flex; justify-content: space-between; align-items: baseline; gap: 2mm; }
.bill-row > :last-child, .bill-total-row > :last-child { white-space: nowrap; }
.bill-item-name { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.bill-muted { font-size: 0.92em; }
.bill-total-row { font-size: 1.2em; font-weight: 700; }
</style></head><body>${bodyHtml}</body></html>`;
}

/**
 * Prints `source`'s content as a receipt on `width` mm paper. It goes through
 * a hidden frame holding only the receipt, so the app behind it adds no blank
 * pages, and the page size is set to the receipt's measured length.
 */
export function printReceipt(source: HTMLElement, width: PaperWidth): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  // Laid out at the paper's width, so the measured height matches the print.
  frame.style.cssText = `position:fixed;left:-10000px;top:0;width:${width}mm;height:10px;border:0;visibility:hidden;`;
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }

  const write = (html: string) => {
    doc.open();
    doc.write(html);
    doc.close();
  };
  write(receiptDocument(source.innerHTML, width));
  // The receipt's own height (the page's would be at least the frame's).
  const heightMm = doc.body.getBoundingClientRect().height / PX_PER_MM;
  write(receiptDocument(source.innerHTML, width, heightMm > 0 ? heightMm : undefined));

  let removed = false;
  const cleanUp = () => {
    if (removed) return;
    removed = true;
    frame.remove();
  };
  win.addEventListener("afterprint", cleanUp);
  // Some browsers never fire afterprint for frames.
  setTimeout(cleanUp, 60_000);
  win.focus();
  win.print();
}
