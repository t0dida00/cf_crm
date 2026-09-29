"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import type { DishKey, ZoneKey } from "@/lib/lexicon";
import { statusLabel } from "@/lib/i18n/labels";

interface Ticket {
  table: number;
  zone: ZoneKey;
  time: string;
  /** An order status, as stored ("New", "Preparing"…). */
  status: string;
  /** Quantity, dish, and an optional note (a key under lexicon.lineNotes). */
  lines: [number, DishKey, ("forOne" | "mediumRare")?][];
  /** Degrees; paper never hangs perfectly straight. */
  tilt: number;
  /** The order that just came in: it drops onto the rail on load. */
  fresh?: boolean;
}

/* Dishes and zones from the restaurant lexicon (lib/lexicon.ts), named in the visitor's language. */
export const TICKETS: Ticket[] = [
  { table: 7, zone: "terrace", time: "19:58", status: "Served", lines: [[2, "seaBass"], [1, "padron"], [2, "cremaCatalana"]], tilt: 0.9 },
  { table: 4, zone: "terrace", time: "20:06", status: "Preparing", lines: [[2, "panConTomate"], [1, "padron"], [1, "seafoodPaella", "forOne"]], tilt: -1.5 },
  { table: 9, zone: "mainHall", time: "20:11", status: "Preparing", lines: [[1, "ribeye", "mediumRare"], [1, "seaBass"], [2, "cremaCatalana"]], tilt: 1.2 },
  { table: 2, zone: "bar", time: "20:14", status: "New", lines: [[1, "iberianHam"], [2, "padron"], [1, "cheesecake"]], tilt: -0.6, fresh: true },
];


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
  const { t } = useTranslation();
  return (
    <div role="img" aria-label={t("marketing.rail.label")} className="relative pt-2">
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
  const { t } = useTranslation();
  const { table, zone, time, status, lines, tilt, fresh } = ticket;
  return (
    <div
      className={`${className} w-[46%] max-w-52 shrink-0 origin-top sm:w-44 lg:w-[47%] ${fresh ? "ticket-drop" : ""}`}
      style={{ "--tilt": `${tilt}deg`, transform: `rotate(${tilt}deg)` } as CSSProperties}
    >
      <TicketClip className="mx-auto" />
      <div className="ticket-torn -mt-1 bg-(--landing-card) px-3.5 pt-3 pb-6 shadow-[0_10px_18px_-10px_rgb(21_32_45/0.45)]">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-2xl font-extrabold [font-variation-settings:'wdth'_62]">{t("common.tableName", { n: table })}</p>
          <p className="text-sm tabular-nums">{time}</p>
        </div>
        <p className="text-sm text-(--landing-muted)">{t(`lexicon.zones.${zone}`)}</p>
        <ul className="mt-3 space-y-1.5 border-t border-dashed border-(--landing-edge) pt-3 text-sm leading-snug">
          {lines.map(([qty, dish, note]) => (
            <li key={dish} className="flex gap-2">
              <span className="w-5 shrink-0 font-bold tabular-nums">{qty}×</span>
              <span>
                {t(`lexicon.dishes.${dish}.name`)}
                {note && <span className="block text-xs text-(--landing-muted)">{t(`lexicon.lineNotes.${note}`)}</span>}
              </span>
            </li>
          ))}
        </ul>
        <p
          className={`mt-4 inline-block rounded-sm px-2 py-0.5 text-sm font-bold ${
            fresh ? "bg-(--landing-saffron)" : "bg-(--landing-bg)"
          }`}
        >
          {statusLabel(t, status)}
        </p>
      </div>
    </div>
  );
}
