"use client";

import { useState, type ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { i18n } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";

/**
 * Puts the app in the language the server picked (cookie or browser), before
 * the first render, so server and browser output match.
 *
 * Each render tree gets its own copy of the instance (sharing the bundled
 * text): on the server one module instance serves every request at once, so
 * switching it for one visitor would switch it for all. In the browser there's
 * one visitor, so the app-wide instance (used by plain helpers) follows too.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [instance] = useState(() => {
    if (typeof window !== "undefined" && i18n.language !== locale) void i18n.changeLanguage(locale);
    return i18n.cloneInstance({ lng: locale, initAsync: false });
  });
  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>;
}
