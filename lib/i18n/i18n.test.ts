import { afterEach, describe, expect, test } from "vitest";
import { pickLocale } from "./config";
import { i18n, intlLocale, t } from "./index";
import { en, vi } from "./messages";

afterEach(() => void i18n.changeLanguage("en"));

/** Every key path in a messages object, e.g. "common.language". */
const keys = (obj: object, prefix = ""): string[] =>
  Object.entries(obj).flatMap(([k, v]) => (typeof v === "string" ? [prefix + k] : keys(v, `${prefix}${k}.`)));

describe("pickLocale", () => {
  test("a saved choice wins", () => {
    expect(pickLocale("vi", "en-US,en;q=0.9")).toBe("vi");
    expect(pickLocale("en", "vi-VN")).toBe("en");
  });

  test("otherwise the browser's most preferred language we speak", () => {
    expect(pickLocale(undefined, "vi-VN,vi;q=0.9,en;q=0.8")).toBe("vi");
    expect(pickLocale(undefined, "fr-FR,vi;q=0.8,en;q=0.9")).toBe("en");
    expect(pickLocale(undefined, "fr-FR,de;q=0.9")).toBe("en");
    expect(pickLocale("klingon", "")).toBe("en");
  });
});

describe("messages", () => {
  test("Vietnamese has exactly the English keys", () => {
    expect(keys(vi).sort()).toEqual(keys(en).sort());
  });

  test("every Vietnamese message is filled in", () => {
    expect(keys(vi).filter((k) => !k.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], vi))).toEqual([]);
  });

  test("the app instance switches language, dates follow", async () => {
    expect(t("common.language")).toBe("Language");
    expect(intlLocale()).toBe("en-GB");
    await i18n.changeLanguage("vi");
    expect(t("common.language")).toBe("Ngôn ngữ");
    expect(intlLocale()).toBe("vi-VN");
  });
});
