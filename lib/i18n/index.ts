import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LOCALE, INTL_LOCALE, isLocale, type Locale } from "./config";
import { RESOURCES } from "./resources";

/**
 * The app-wide instance: components use it through useTranslation(), and
 * plain helpers (validation messages, notices) through `t` below. It starts in
 * English; I18nProvider switches it to the visitor's language before the first
 * render. Both languages are bundled, so switching is synchronous.
 */
export const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({
  resources: RESOURCES,
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: ["en", "vi"],
  initAsync: false,
  interpolation: { escapeValue: false }, // React escapes already
  returnNull: false,
});

/** Translate outside React (helpers that build messages), in the language in use. */
export const t = i18n.t.bind(i18n) as typeof i18n.t;

/** The language in use now. */
export const currentLocale = (): Locale => (isLocale(i18n.language) ? i18n.language : DEFAULT_LOCALE);

/** Dates and numbers in the language in use ("en-GB" or "vi-VN"). */
export const intlLocale = () => INTL_LOCALE[currentLocale()];
