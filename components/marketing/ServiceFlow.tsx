"use client";

import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";

export type Lane = "Guest" | "Staff" | "Owner";

export const LANES: Lane[] = ["Guest", "Staff", "Owner"];

/** Each role's mark: saffron for the guest, cobalt for staff, ink for the owner. */
const LANE_COLOUR: Record<Lane, string> = {
  Guest: "var(--landing-saffron)",
  Staff: "var(--landing-accent)",
  Owner: "var(--landing-ink)",
};

/** A step's text: a key under marketing.flow. */
type FlowStep = "scan" | "order" | "ticket" | "cook" | "bill" | "checkout" | "takings";

/** One table's evening, in order: every step is something Tably does. */
export const SERVICE_FLOW: { lane: Lane; time: string; text: FlowStep }[] = [
  { lane: "Guest", time: "20:02", text: "scan" },
  // Placing the order seats the table: no one has to seat the guests.
  { lane: "Guest", time: "20:04", text: "order" },
  { lane: "Staff", time: "20:04", text: "ticket" },
  { lane: "Staff", time: "20:25", text: "cook" },
  { lane: "Guest", time: "21:05", text: "bill" },
  { lane: "Staff", time: "21:08", text: "checkout" },
  { lane: "Owner", time: "21:08", text: "takings" },
];

const COLS = SERVICE_FLOW.length;

/**
 * The connector through every step, in viewBox units (100 per column and per
 * lane): across to the gap between columns, up or down to the next step's
 * lane, then across into it.
 */
export function flowPath(lanes: Lane[] = SERVICE_FLOW.map((s) => s.lane)): string {
  const point = (i: number) => ({ x: i * 100 + 50, y: LANES.indexOf(lanes[i]) * 100 + 50 });
  let d = `M${point(0).x} ${point(0).y}`;
  for (let i = 1; i < lanes.length; i++) {
    const { x, y } = point(i);
    d += ` H${x - 50} V${y} H${x}`;
  }
  return d;
}

/**
 * The whole service as a swimlane: who does what, left to right through the
 * evening. On narrow screens the same list reads as a vertical timeline.
 */
export function ServiceFlow() {
  const { t } = useTranslation();
  return (
    <figure className="w-full">
      <figcaption className="sr-only">{t("marketing.flow.caption")}</figcaption>
      <div className="relative xl:grid xl:grid-cols-[5.5rem_minmax(0,1fr)]">
        {/* Lane names and bands (wide screens). */}
        <div aria-hidden className="hidden xl:grid xl:grid-rows-[repeat(3,7rem)]">
          {LANES.map((lane) => (
            <span key={lane} className="flex items-center gap-2 text-sm font-bold">
              <span className="size-2.5 rounded-full" style={{ background: LANE_COLOUR[lane] }} />
              {t(`marketing.flow.lanes.${lane}`)}
            </span>
          ))}
        </div>

        <div className="relative">
          <div aria-hidden className="absolute inset-0 hidden xl:grid xl:grid-rows-[repeat(3,7rem)]">
            {LANES.map((lane, i) => (
              <span key={lane} className={i % 2 === 0 ? "rounded-lg bg-(--landing-card)/60" : ""} />
            ))}
          </div>
          <svg
            aria-hidden
            viewBox={`0 0 ${COLS * 100} ${LANES.length * 100}`}
            preserveAspectRatio="none"
            className="absolute inset-0 hidden h-full w-full xl:block"
          >
            <path
              d={flowPath()}
              fill="none"
              stroke="var(--landing-edge)"
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <ol
            className="relative max-w-2xl space-y-3 border-l-2 border-(--landing-edge) pl-5 xl:grid xl:max-w-none xl:space-y-0 xl:border-0 xl:pl-0"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: "repeat(3, 7rem)" }}
          >
            {SERVICE_FLOW.map(({ lane, time, text }, i) => (
              <li
                key={text}
                className="relative xl:[grid-column:var(--col)] xl:[grid-row:var(--row)] xl:flex xl:items-center xl:px-1.5"
                style={{ "--col": i + 1, "--row": LANES.indexOf(lane) + 1 } as CSSProperties}
              >
                {/* The timeline dot (narrow screens). */}
                <span
                  aria-hidden
                  className="absolute top-4 -left-[27px] size-3 rounded-full border-2 border-(--landing-bg-alt) xl:hidden"
                  style={{ background: LANE_COLOUR[lane] }}
                />
                <div
                  className="w-full rounded-lg border border-(--landing-border) border-l-4 bg-(--landing-card) px-3 py-2.5 shadow-[0_6px_14px_-10px_rgb(21_32_45/0.4)]"
                  style={{ borderLeftColor: LANE_COLOUR[lane] }}
                >
                  <p className="flex items-baseline justify-between gap-2 text-xs text-(--landing-muted)">
                    {/* Wide screens show the lane instead; screen readers always hear who. */}
                    <span className="font-bold text-(--landing-ink) xl:sr-only">{t(`marketing.flow.lanes.${lane}`)}</span>
                    <time className="tabular-nums">{time}</time>
                  </p>
                  <p className="mt-0.5 text-sm leading-snug font-semibold text-pretty">{t(`marketing.flow.${text}`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </figure>
  );
}
