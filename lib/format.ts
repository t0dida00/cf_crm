const LOCALE = "en-GB";

const integerFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const moneyFormat = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Whole numbers with thousands separators: 1000006 → "1,000,006". */
export const formatNumber = (value: number) => integerFormat.format(value);

/** An amount in the workspace currency with thousands separators and two
 * decimals: (66312720, "€") → "€66,312,720.00". */
export const money = (value: number, currency: string) =>
  `${currency}${moneyFormat.format(value)}`;
