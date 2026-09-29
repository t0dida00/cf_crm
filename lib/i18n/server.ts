import i18next from "i18next";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, pickLocale, type Locale } from "./config";
import { RESOURCES } from "./resources";

/** The visitor's language on the server: their cookie, else Accept-Language. */
export async function getLocale(): Promise<Locale> {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  return pickLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerList.get("accept-language"));
}

/** A translator for server components and metadata, in the visitor's language. */
export async function getServerT() {
  const locale = await getLocale();
  const instance = i18next.createInstance();
  await instance.init({
    resources: RESOURCES,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    initAsync: false,
    interpolation: { escapeValue: false },
  });
  return { t: instance.t, locale };
}
