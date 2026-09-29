import type { CSSProperties } from "react";

interface Ticket {
  table: string;
  zone: string;
  time: string;
  status: string;
  lines: [number, string, string?][];
  /** Degrees; paper never hangs perfectly straight. */
  tilt: number;
  /** The order that just came in: it drops onto the rail on load. */
  fresh?: boolean;
}

/* Dishes and zones from the restaurant lexicon (lib/lexicon.ts). */
export const TICKETS: Ticket[] = [
  {
    table: "Table 7",
    zone: "Terrace",
    time: "19:58",
    status: "Served",
    lines: [[2, "Grilled sea bass"], [1, "Padrón peppers"], [2, "Crema catalana"]],
    tilt: 0.9,
  },
  {
    table: "Table 4",
    zone: "Terrace",
    time: "20:06",
    status: "Preparing",
    lines: [[2, "Pan con tomate"], [1, "Padrón peppers"], [1, "Seafood paella", "For one"]],
    tilt: -1.5,
  },
  {
    table: "Table 9",
    zone: "Main hall",
    time: "20:11",
    status: "Preparing",
    lines: [[1, "Ribeye 300g", "Medium rare"], [1, "Grilled sea bass"], [2, "Crema catalana"]],
    tilt: 1.2,
  },
  {
    table: "Table 2",
    zone: "Bar",
    time: "20:14",
    status: "New",
    lines: [[1, "Iberian ham plate"], [2, "Padrón peppers"], [1, "Cheesecake"]],
    tilt: -0.6,
    fresh: true,
  },
];

const RAIL_LABEL =
  "Order tickets on the kitchen rail. The newest, from table 2 at the bar, has just arrived.";

/**
 * Which tickets hang at each width, by age (0 = newest): the two newest always;
 * a third from small tablets and a fourth from 880px, while the rail spans the
 * page under the text. Beside the text (lg) the column fits only two.
 */
export function ticketVisibility(age: number): string | undefined {
  if (age < 2) return undefined;
  if (age === 2) return "hidden sm:block lg:hidden";
  return "hidden min-[880px]:block lg:hidden";
}

/** The hero: order tickets hanging from the pass rail, the newest dropping in. */
export function TicketRail() {
  return (
    <div role="img" aria-label={RAIL_LABEL} className="relative pt-2">
      <PassRail />
      {/* Under the text (below lg) the tickets spread along the whole rail; beside it they sit right. */}
      <div className="-mt-1.5 flex justify-end gap-3 overflow-hidden px-2 pb-6 sm:justify-around sm:gap-4 lg:justify-end">
        {TICKETS.map((ticket, i) => (
          <TicketSlip key={ticket.table} ticket={ticket} className={ticketVisibility(TICKETS.length - 1 - i)} />
        ))}
      </div>
    </div>
  );
}

/** The steel rail tickets hang from (the landing hero, the sign-in page).
 * Brushed steel: the gradient is the material, not decoration. */
export function PassRail() {
  return (
    <div className="relative z-10 h-3.5 rounded-full border border-(--landing-edge) bg-[linear-gradient(#fbfcfc,#aeb8c1_55%,#8a96a1)]" />
  );
}

/** The clip that holds a ticket on the rail. */
export function TicketClip({ className = "" }: { className?: string }) {
  return <div className={`h-4 w-9 rounded-b-sm bg-(--landing-edge) ${className}`} />;
}

function TicketSlip({ ticket, className = "" }: { ticket: Ticket; className?: string }) {
  const { table, zone, time, status, lines, tilt, fresh } = ticket;
  return (
    <div
      className={`${className} w-[46%] max-w-52 shrink-0 origin-top sm:w-44 lg:w-[47%] ${fresh ? "ticket-drop" : ""}`}
      style={{ "--tilt": `${tilt}deg`, transform: `rotate(${tilt}deg)` } as CSSProperties}
    >
      <TicketClip className="mx-auto" />
      <div className="ticket-torn -mt-1 bg-(--landing-card) px-3.5 pt-3 pb-6 shadow-[0_10px_18px_-10px_rgb(21_32_45/0.45)]">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl font-extrabold [font-variation-settings:'wdth'_62]">{table}</p>
          <p className="text-sm tabular-nums">{time}</p>
        </div>
        <p className="text-sm text-(--landing-muted)">{zone}</p>
        <ul className="mt-3 space-y-1.5 border-t border-dashed border-(--landing-edge) pt-3 text-sm leading-snug">
          {lines.map(([qty, name, note]) => (
            <li key={name} className="flex gap-2">
              <span className="w-5 shrink-0 font-bold tabular-nums">{qty}×</span>
              <span>
                {name}
                {note && <span className="block text-xs text-(--landing-muted)">{note}</span>}
              </span>
            </li>
          ))}
        </ul>
        <p
          className={`mt-4 inline-block rounded-sm px-2 py-0.5 text-sm font-bold ${
            fresh ? "bg-(--landing-saffron)" : "bg-(--landing-bg)"
          }`}
        >
          {status}
        </p>
      </div>
    </div>
  );
}
