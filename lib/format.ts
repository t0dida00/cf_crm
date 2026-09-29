const LOCALE = "en-GB";

const integerFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const moneyFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Whole numbers with thousands separators: 1000006 → "1,000,006". */
export const formatNumber = (value: number) => integerFormat.format(value);

/** Above this, a sidebar count shows "100+": the exact number stops mattering. */
export const MAX_BADGE_COUNT = 100;

/** A sidebar count: 42 → "42", 500 → "100+". */
export const formatBadgeCount = (value: number) =>
  value > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : formatNumber(value);

/** Vietnamese đồng: whole numbers, dots between thousands, the symbol after ("120.000 ₫"). */
export const VND = "₫";
const vndFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

/** An amount in the workspace currency with thousands separators and two
 * decimals: (66312720, "€") → "€66,312,720.00"; the đồng as (120000, "₫") → "120.000 ₫". */
export const money = (value: number, currency: string) =>
  currency === VND ? `${vndFormat.format(value)} ${VND}` : `${currency}${moneyFormat.format(value)}`;

const trim = (n: number) => String(Math.round(n * 10) / 10);

/** Short amounts for chart axes: (7616136, "€") → "€7.6M", (240000, "€") → "€240K".
 * Hand-rolled because Intl's compact notation differs between engines ("K" vs "k"). */
export const moneyCompact = (value: number, currency: string): string => {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  // The đồng's symbol goes after: "240K ₫".
  if (currency === VND) return `${moneyCompact(value, "")} ${VND}`;
  if (abs >= 1e9) return `${currency}${sign}${trim(abs / 1e9)}B`;
  if (abs >= 1e6) return `${currency}${sign}${trim(abs / 1e6)}M`;
  if (abs >= 1e3) return `${currency}${sign}${trim(abs / 1e3)}K`;
  return `${currency}${sign}${trim(abs)}`;
};
