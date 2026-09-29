import { describe, expect, test } from "vitest";
import type { Category, Dish } from "./types";
import { decodeCsvFile, NotUtf8Error } from "./csv";
import { MENU_CSV_COLUMNS, menuToCsv, parseMenuCsv, planMenuImport, SAMPLE_MENU_CSV } from "./menuCsv";

const HEADER = MENU_CSV_COLUMNS.join(",");
const file = (...lines: string[]) => [HEADER, ...lines].join("\n");

describe("parseMenuCsv", () => {
  test("reads every column and its codes", () => {
    const { rows, errors } = parseMenuCsv(
      file(
        "Mains,Seafood paella,19.5,2,10,For one,https://x.public.blob.vercel-storage.com/p.jpg,1,1",
        "Drinks,Red wine,6,1,wine,,,no,0",
        "Starters,Bread,2,0,,,,,",
      ),
      ["Wine"],
    );
    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({
      line: 2,
      category: "Mains",
      name: "Seafood paella",
      price: 19.5,
      taxMode: "exclude",
      taxPct: 10,
      description: "For one",
      imageUrl: "https://x.public.blob.vercel-storage.com/p.jpg",
      isVegan: true,
      status: "sold_out",
    });
    // An included tax is named; case doesn't matter.
    expect(rows[1]).toMatchObject({ taxMode: "include", taxName: "Wine", isVegan: false, status: "hidden" });
    // Blank tax, vegan and status mean none, no and available.
    expect(rows[2]).toMatchObject({ taxMode: "none", isVegan: false, status: "valid" });
  });

  test("an included tax with no value is the common tax", () => {
    const { rows } = parseMenuCsv(file("Mains,Soup,5,1,,,,0,2"), []);
    expect(rows[0].taxName).toBe("Common tax");
  });

  test("reports each problem with its line, and keeps no rows from a bad line", () => {
    const { rows, errors } = parseMenuCsv(
      file(
        ",Soup,-1,3,,,,maybe,5",
        "Mains,Steak,20,2,300,,http://insecure.example/p.jpg,0,2",
        "Drinks,Beer,4,1,Beer tax,,,0,2",
      ),
      ["Wine"],
    );
    expect(rows).toEqual([]);
    expect(errors.map((e) => `${e.line}: ${e.message}`)).toEqual([
      "2: Category is required.",
      "2: Price must be a number, 0 or more.",
      "2: Tax must be 0 (none), 1 (included) or 2 (added at checkout).",
      "2: is_vegan must be 1 or 0.",
      "2: Status must be 0 (hidden), 1 (sold out) or 2 (available).",
      "3: Tax value must be a percentage from 0 to 200.",
      "3: Photo must be an https:// link (Vercel Blob or S3).",
      '4: Tax value must be "Common tax" or one of your special taxes (Wine).',
    ]);
  });

  test("the same dish twice in one category is an error", () => {
    const { errors } = parseMenuCsv(file("Mains,Soup,5,0,,,,0,2", "mains,SOUP,6,0,,,,0,2"), []);
    expect(errors).toEqual([{ line: 3, message: '"SOUP" appears twice in mains.' }]);
  });

  test("names missing columns, and matches columns in any order", () => {
    expect(parseMenuCsv("category,name\nMains,Soup", []).errors[0].message).toMatch(/^Missing columns: price, tax/);
    const reordered = ["status", ...MENU_CSV_COLUMNS.filter((c) => c !== "status")].join(",");
    expect(parseMenuCsv(`${reordered}\n0,Mains,Soup,5,0,,,,0`, []).rows[0]).toMatchObject({ name: "Soup", status: "hidden" });
  });

  test("an empty file or a header alone has nothing to import", () => {
    expect(parseMenuCsv("", []).errors).toEqual([{ line: 1, message: "The file is empty." }]);
    expect(parseMenuCsv(HEADER, []).errors).toEqual([{ line: 2, message: "The file has no dishes." }]);
  });

  test("the sample file is valid", () => {
    const { rows, errors } = parseMenuCsv(SAMPLE_MENU_CSV, []);
    expect(errors).toEqual([]);
    expect(new Set(rows.map((r) => r.taxMode))).toEqual(new Set(["none", "include", "exclude"]));
    expect(new Set(rows.map((r) => r.status))).toEqual(new Set(["valid", "sold_out", "hidden"]));
  });
});

const CATEGORIES: Category[] = [{ id: "c1", name: "Mains", valid: true }];
const DISHES: Dish[] = [
  { id: "d1", name: "Soup", price: 5, catId: "c1", status: "valid", taxMode: "include", taxName: "Wine", isVegan: true },
  { id: "d2", name: "Steak, rare", price: 20, catId: "c1", status: "hidden", taxMode: "exclude", taxPct: 10, description: 'The "big" one' },
];

describe("menuToCsv", () => {
  test("an export imports back as the same menu", () => {
    const { rows, errors } = parseMenuCsv(menuToCsv(CATEGORIES, DISHES), ["Wine"]);
    expect(errors).toEqual([]);
    expect(rows.map(({ line: _line, ...r }) => r)).toEqual([
      { category: "Mains", name: "Soup", price: 5, taxMode: "include", taxName: "Wine", taxPct: undefined, description: undefined, imageUrl: undefined, isVegan: true, status: "valid" },
      { category: "Mains", name: "Steak, rare", price: 20, taxMode: "exclude", taxName: undefined, taxPct: 10, description: 'The "big" one', imageUrl: undefined, isVegan: false, status: "hidden" },
    ]);
  });
});

describe("planMenuImport", () => {
  test("updates dishes matched by category and name, adds the rest, and lists new categories once", () => {
    const { rows } = parseMenuCsv(
      file("mains,soup,6,0,,,,0,2", "Mains,Salad,7,0,,,,1,2", "Desserts,Flan,4,0,,,,0,2", "desserts,Tart,5,0,,,,0,2"),
      [],
    );
    const plan = planMenuImport(rows, CATEGORIES, DISHES);
    expect(plan.update.map((u) => [u.id, u.row.price])).toEqual([["d1", 6]]);
    expect(plan.add.map((r) => r.name)).toEqual(["Salad", "Flan", "Tart"]);
    expect(plan.newCategories).toEqual(["Desserts"]);
  });
});

describe("Vietnamese and other accented text", () => {
  const VI = "category,name,price,tax,tax_value,description,photo,is_vegan,status\nMón chính,Phở bò,9.5,0,,\"Nước dùng bò, hành lá\",,0,2\n";
  const bytes = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer;

  test("a UTF-8 file reads back exactly, with or without the byte-order mark", () => {
    for (const text of [decodeCsvFile(bytes(VI)), decodeCsvFile(bytes("\uFEFF" + VI))]) {
      const { rows, errors } = parseMenuCsv(text, []);
      expect(errors).toEqual([]);
      expect(rows[0]).toMatchObject({ category: "Món chính", name: "Phở bò", description: "Nước dùng bò, hành lá" });
    }
  });

  test("a file in a Windows code page is refused, with how to fix it", () => {
    // "Phở" in Windows-1258-style single bytes: not valid UTF-8.
    const legacy = new Uint8Array([0x50, 0x68, 0xd5, 0x2c, 0x31, 0x0a]).buffer;
    expect(() => decodeCsvFile(legacy)).toThrow(NotUtf8Error);
    expect(() => decodeCsvFile(legacy)).toThrow(/CSV UTF-8/);
  });

  test("decomposed accents (as macOS can save them) match the dish already on the menu", () => {
    const decomposed = VI.normalize("NFD");
    expect(decomposed).not.toBe(VI);
    const { rows } = parseMenuCsv(decomposed, []);
    expect(rows[0].name).toBe("Phở bò");
    const plan = planMenuImport(
      rows,
      [{ id: "c9", name: "Món chính", valid: true }],
      [{ id: "d9", name: "Phở bò", price: 9, catId: "c9", status: "valid", taxMode: "none" }],
    );
    expect(plan.update.map((u) => u.id)).toEqual(["d9"]);
    expect(plan.add).toEqual([]);
  });

  test("the sample file carries a Vietnamese dish", () => {
    expect(parseMenuCsv(SAMPLE_MENU_CSV, []).rows.map((r) => r.name)).toContain("Phở bò");
  });
});
