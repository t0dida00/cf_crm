import { ClockCounterClockwise, PencilSimple } from "@phosphor-icons/react";
import type { TableRec } from "@/lib/types";

/** More chairs than this are drawn as this many; the label still gives the real count. */
export const MAX_DRAWN_CHAIRS = 12;

const CHAIR = 14; // chair width, px
const PITCH = 22; // chair to chair
const GAP = 5; // chair to table edge

/**
 * Where the chairs go, seen from above: half along the top edge, the rest along
 * the bottom, so the table grows longer with its seats like a real one.
 */
export function chairLayout(seats: number): { top: number; bottom: number } {
  const drawn = Math.min(Math.max(Math.round(seats), 1), MAX_DRAWN_CHAIRS);
  return { top: Math.ceil(drawn / 2), bottom: Math.floor(drawn / 2) };
}

/** One table on the floor plan: the table and its chairs, name, seats and actions. */
export function TableTile({
  table,
  onHistory,
  onEdit,
}: {
  table: TableRec;
  onHistory: () => void;
  onEdit: () => void;
}) {
  const { top, bottom } = chairLayout(table.seats);
  const perSide = Math.max(top, 1);
  const tableWidth = perSide * PITCH + 6;
  const width = tableWidth + 8;
  const height = 64;
  const chairX = (i: number, count: number) => (width - count * PITCH) / 2 + i * PITCH + (PITCH - CHAIR) / 2;

  return (
    <li className="flex min-w-0 flex-col rounded-xl border bg-card p-3 sm:p-4">
      <p className="font-bold">{table.name}</p>
      <p className="text-sm text-muted-foreground">
        {table.seats} {table.seats === 1 ? "seat" : "seats"}
      </p>

      <div className="flex flex-1 items-center justify-center py-4">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="max-w-full">
          {Array.from({ length: top }, (_, i) => (
            <rect key={`t${i}`} x={chairX(i, top)} y={0} width={CHAIR} height={10} rx={3} className="fill-brand-100 stroke-brand-600" />
          ))}
          <rect
            x={(width - tableWidth) / 2}
            y={10 + GAP}
            width={tableWidth}
            height={height - 2 * (10 + GAP)}
            rx={6}
            className="fill-brand-50 stroke-brand-600"
            strokeWidth={1.5}
          />
          {Array.from({ length: bottom }, (_, i) => (
            <rect
              key={`b${i}`}
              x={chairX(i, bottom)}
              y={height - 10}
              width={CHAIR}
              height={10}
              rx={3}
              className="fill-brand-100 stroke-brand-600"
            />
          ))}
        </svg>
      </div>

      <div className="-mx-1 -mb-1 flex gap-1 border-t pt-2">
        <button
          type="button"
          onClick={onHistory}
          className="flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={`Orders at ${table.name}`}
        >
          <ClockCounterClockwise size={15} weight="bold" aria-hidden />
          {/* Icons only on phones, where two tiles share a row. */}
          <span className="hidden sm:inline">Orders</span>
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="ml-auto flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label={`Edit ${table.name}`}
        >
          <PencilSimple size={15} weight="bold" aria-hidden />
          <span className="hidden sm:inline">Edit</span>
        </button>
      </div>
    </li>
  );
}
