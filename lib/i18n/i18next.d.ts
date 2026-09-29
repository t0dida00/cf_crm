import type en from "./locales/en.json";

/** Type-checked keys: t("admin.menu.title") must exist in en.ts. */
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: { translation: typeof en };
    returnNull: false;
  }
}
