"use client";

import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import type { TableRec, TableState } from "@/lib/types";
import { cn } from "@/lib/utils";

/** More chairs than this are drawn as this many; the label still gives the real count. */
export const MAX_DRAWN_CHAIRS = 12;

const CHAIR = 14; // chair width, px
const PITCH = 22; // chair to chair
const GAP = 5; // chair to table edge

/** The drawing's colours: brand for setup (admin), the state's colour on the
 * floor (staff). A tappable tile's border takes the table's colour on hover. */
const TONE: Record<TableState | "plan", { table: string; chair: string; hover: string }> = {
  plan: { table: "fill-brand-50 stroke-brand-600", chair: "fill-brand-100 stroke-brand-600", hover: "hover:border-brand-600" },
  Free: { table: "fill-green-50 stroke-green-600", chair: "fill-green-100 stroke-green-600", hover: "hover:border-green-600" },
  Booked: { table: "fill-amber-50 stroke-amber-600", chair: "fill-amber-100 stroke-amber-600", hover: "hover:border-amber-600" },
  Seated: { table: "fill-brand-100 stroke-brand-700", chair: "fill-brand-600 stroke-brand-700", hover: "hover:border-brand-700" },
  Finished: {
    table: "fill-secondary stroke-muted-foreground",
    chair: "fill-secondary stroke-muted-foreground",
    hover: "hover:border-muted-foreground",
  },
};

/**
 * Where the chairs go, seen from above: half along the top edge, the rest along
 * the bottom, so the table grows longer with its seats like a real one.
 */
export function chairLayout(seats: number): { top: number; bottom: number } {
  const drawn = Math.min(Math.max(Math.round(seats), 1), MAX_DRAWN_CHAIRS);
  return { top: Math.ceil(drawn / 2), bottom: Math.floor(drawn / 2) };
}

/** A table and its chairs seen from above (decorative: the tile names the seats). */
export function TableDrawing({ seats, tone = "plan" }: { seats: number; tone?: TableState | "plan" }) {
  const { top, bottom } = chairLayout(seats);
  const tableWidth = Math.max(top, 1) * PITCH + 6;
  const width = tableWidth + 8;
  const height = 64;
  const colours = TONE[tone];
  const chairX = (i: number, count: number) => (width - count * PITCH) / 2 + i * PITCH + (PITCH - CHAIR) / 2;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="max-w-full">
      {Array.from({ length: top }, (_, i) => (
        <rect key={`t${i}`} x={chairX(i, top)} y={0} width={CHAIR} height={10} rx={3} className={colours.chair} />
      ))}
      <rect
        x={(width - tableWidth) / 2}
        y={10 + GAP}
        width={tableWidth}
        height={height - 2 * (10 + GAP)}
        rx={6}
        className={colours.table}
        strokeWidth={1.5}
      />
      {Array.from({ length: bottom }, (_, i) => (
        <rect key={`b${i}`} x={chairX(i, bottom)} y={height - 10} width={CHAIR} height={10} rx={3} className={colours.chair} />
      ))}
    </svg>
  );
}

/**
 * One table on a floor plan: name, seats, the drawing, then the app's own
 * footer. Admin passes its Orders/Edit buttons; staff pass the state tag
 * (`aside`), a detail line and `onOpen`, which makes the whole tile a button.
 */
export function TableTile({
  table,
  tone = "plan",
  aside,
  footer,
  onOpen,
}: {
  table: TableRec;
  tone?: TableState | "plan";
  aside?: ReactNode;
  footer: ReactNode;
  onOpen?: () => void;
}) {
  const { t } = useTranslation();
  const body = (
    <>
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0">
          <span className="block font-bold">{table.name}</span>
          <span className="block text-sm text-muted-foreground">
            {t("admin.tables.seats", { count: table.seats, n: table.seats })}
          </span>
        </span>
        {aside}
      </span>
      <span className="flex flex-1 items-center justify-center py-4">
        <TableDrawing seats={table.seats} tone={tone} />
      </span>
      {footer}
    </>
  );
  const frame = "flex h-full w-full flex-col rounded-xl border bg-card p-3 text-left sm:p-4";

  return (
    <li className="min-w-0">
      {onOpen ? (
        <button type="button" onClick={onOpen} className={cn(frame, "transition-colors", TONE[tone].hover)}>
          {body}
        </button>
      ) : (
        <div className={frame}>{body}</div>
      )}
    </li>
  );
}
