import en from "./locales/en.json";
import viJson from "./locales/vi.json";

/**
 * The text of every screen, by area. English is the source of truth; every
 * key must also be in Vietnamese: assigning vi.json to the English shape makes
 * a missing key a type error. Use {{name}} for values and _one/_other for plurals.
 */
export type Messages = DeepStrings<typeof en>;
type DeepStrings<T> = { [K in keyof T]: T[K] extends string ? string : DeepStrings<T[K]> };

export { en };
export const vi: Messages = viJson;
