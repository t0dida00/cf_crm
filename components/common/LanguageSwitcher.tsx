"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { i18n as appI18n } from "@/lib/i18n";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, LOCALE_NAMES, LOCALES, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/** Saves the choice (cookie, a year), switches the app, and re-renders server content in it. */
export function useChangeLanguage() {
  const { i18n } = useTranslation();
  const router = useRouter();
  return (locale: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
    document.documentElement.lang = locale;
    // This page's instance, and the app-wide one plain helpers use.
    void i18n.changeLanguage(locale);
    void appI18n.changeLanguage(locale);
    router.refresh();
  };
}

/**
 * English / Tiếng Việt, as a pair of radios (a single choice). Each name is
 * written in its own language and marked with `lang`, so screen readers
 * pronounce it right. `tone="dark"` for the navy sidebar.
 */
export function LanguageSwitcher({ tone = "light", className }: { tone?: "light" | "dark"; className?: string }) {
  const { t, i18n } = useTranslation();
  const change = useChangeLanguage();
  return (
    <fieldset className={cn("flex items-center", className)}>
      <legend className="sr-only">{t("common.language")}</legend>
      <div
        className={cn(
          "flex rounded-full border p-0.5 text-xs font-semibold",
          tone === "dark" ? "border-white/20" : "border-input-border bg-background",
        )}
      >
        {LOCALES.map((locale) => {
          const checked = i18n.language === locale;
          return (
            <label
              key={locale}
              lang={locale}
              className={cn(
                "cursor-pointer rounded-full px-2.5 py-1 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                checked
                  ? tone === "dark"
                    ? "bg-white text-ink"
                    : "bg-foreground text-background"
                  : tone === "dark"
                    ? "text-white/70 hover:text-white"
                    : "text-muted-foreground hover:text-foreground",
              )}
            >
              <input
                type="radio"
                name="language"
                value={locale}
                checked={checked}
                onChange={() => change(locale)}
                className="sr-only"
              />
              {LOCALE_NAMES[locale]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
