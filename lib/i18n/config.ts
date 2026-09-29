/** The languages Tably speaks, and how one is chosen for a visitor. */
export const LOCALES = ["en", "vi"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Remembers a visitor's choice from the language switcher (a year). */
export const LOCALE_COOKIE = "lang";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Each language's name in itself, as the switcher shows it. */
export const LOCALE_NAMES: Record<Locale, string> = { en: "English", vi: "Tiếng Việt" };

/** BCP 47 tags for dates and numbers (Intl). */
export const INTL_LOCALE: Record<Locale, string> = { en: "en-GB", vi: "vi-VN" };

export const isLocale = (value: unknown): value is Locale => LOCALES.includes(value as Locale);

/**
 * The visitor's language: their saved choice, else the first of the browser's
 * preferred languages we speak (Accept-Language, in its order), else English.
 */
export function pickLocale(cookie?: string | null, acceptLanguage?: string | null): Locale {
  if (isLocale(cookie)) return cookie;
  const preferred = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { base: tag.toLowerCase().split("-")[0], q: q === undefined ? 1 : Number(q) };
    })
    .filter((p) => p.base && Number.isFinite(p.q) && p.q > 0)
    .sort((a, b) => b.q - a.q);
  return preferred.map((p) => p.base).find(isLocale) ?? DEFAULT_LOCALE;
}
