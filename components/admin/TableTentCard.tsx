"use client";

import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";

/** Card size in SVG units; a 3:4 card that prints well at A6. */
export const TENT_WIDTH = 240;
export const TENT_HEIGHT = 320;

const INK = "#232f3f"; // --ink, the admin sidebar
const TEXT = "#15202d";
const MUTED = "#4e5b67";
const FONT = "'Nunito Sans', Helvetica, Arial, sans-serif";
const QR_SIZE = 150;

/** Cuts a name to fit one line of the card, since SVG text doesn't wrap. */
export function fitLine(text: string, max: number): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

/**
 * The card that stands on the table, drawn as one SVG so the page shows exactly
 * what Download saves: the restaurant's name on an ink band, the table's name,
 * its code and what to do with it.
 */
export function TableTentCard({
  id,
  qrId,
  restaurant,
  table,
  url,
}: {
  id: string;
  /** The code's own id, so it can be saved without the card. */
  qrId: string;
  restaurant: string;
  table: string;
  url: string;
}) {
  const { t } = useTranslation();
  return (
    <svg
      id={id}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${TENT_WIDTH} ${TENT_HEIGHT}`}
      width={TENT_WIDTH}
      height={TENT_HEIGHT}
      role="img"
      aria-label={t("admin.qr.cardLabel", { table })}
      className="h-auto max-w-full"
      fontFamily={FONT}
    >
      <rect x={0.5} y={0.5} width={TENT_WIDTH - 1} height={TENT_HEIGHT - 1} rx={14} fill="#fff" stroke="#c3cbd2" />
      <path d={`M0.5 52 V14.5 A14 14 0 0 1 14.5 0.5 H${TENT_WIDTH - 14.5} A14 14 0 0 1 ${TENT_WIDTH - 0.5} 14.5 V52 Z`} fill={INK} />
      <text x={TENT_WIDTH / 2} y={32} textAnchor="middle" fill="#fff" fontSize={14} fontWeight={700}>
        {fitLine(restaurant || t("admin.qr.welcome"), 28)}
      </text>

      <text x={TENT_WIDTH / 2} y={92} textAnchor="middle" fill={TEXT} fontSize={30} fontWeight={800}>
        {fitLine(table, 14)}
      </text>

      <QRCodeSVG
        id={qrId}
        title={t("admin.qr.codeFor", { table })}
        value={url}
        x={(TENT_WIDTH - QR_SIZE) / 2}
        y={110}
        size={QR_SIZE}
        level="M"
        fgColor={TEXT}
      />

      <text x={TENT_WIDTH / 2} y={286} textAnchor="middle" fill={TEXT} fontSize={14} fontWeight={700}>
        {t("admin.qr.scan")}
      </text>
      <text x={TENT_WIDTH / 2} y={304} textAnchor="middle" fill={MUTED} fontSize={11}>
        {t("admin.qr.noApp")}
      </text>
    </svg>
  );
}
