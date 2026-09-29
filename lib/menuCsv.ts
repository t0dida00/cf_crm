import type { Category, Dish, DishStatus, TaxMode } from "./types";
import { MAX_SPECIAL_TAX } from "./validation";

/** The menu file's columns, in order. Import matches them by name, in any order. */
export const MENU_CSV_COLUMNS = [
  "category",
  "name",
  "price",
  "tax",
  "tax_value",
  "description",
  "photo",
  "is_vegan",
  "status",
] as const;

export const COMMON_TAX = "Common tax";

/** tax: 0 none, 1 included in the price (tax_value names the tax), 2 added at checkout (tax_value is the %). */
const TAX_CODES: Record<string, TaxMode> = { "0": "none", "1": "include", "2": "exclude" };
/** status: 0 hidden, 1 sold out, 2 available. */
const STATUS_CODES: Record<string, DishStatus> = { "0": "hidden", "1": "sold_out", "2": "valid" };
const TAX_CODE_OF: Record<TaxMode, string> = { none: "0", include: "1", exclude: "2" };
const STATUS_CODE_OF: Record<DishStatus, string> = { hidden: "0", sold_out: "1", valid: "2" };

/** A downloadable example of the format: one row for each tax type and status. */
export const SAMPLE_MENU_CSV = toCsv([
  [...MENU_CSV_COLUMNS],
  ["Starters", "Pan con tomate", "5.5", "0", "", "Toasted sourdough, tomato, olive oil", "", "1", "2"],
  ["Starters", "Padrón peppers", "7", "1", COMMON_TAX, "Blistered, sea salt", "", "1", "2"],
  [
    "Mains",
    "Seafood paella",
    "19.5",
    "2",
    "10",
    "For one: prawn, mussel, squid",
    "https://your-store.public.blob.vercel-storage.com/paella.jpg",
    "0",
    "1",
  ],
  ["Desserts", "Crema catalana", "6.5", "0", "", "", "", "0", "0"],
  // Accents survive the round trip: the file is UTF-8.
  ["Món chính", "Phở bò", "9.5", "0", "", "Nước dùng bò, bánh phở, hành lá", "", "0", "2"],
]);

/**
 * Marks a file as UTF-8 for spreadsheet apps: without it Excel opens a CSV in
 * the Windows code page, and "Phở" shows as "PhÆ¡Ì‰". Exports and the sample
 * start with it; parseCsv skips it.
 */
export const UTF8_BOM = "\uFEFF";

/** The file isn't UTF-8 (usually Excel's plain "CSV (Comma delimited)"). */
export class NotUtf8Error extends Error {
  constructor() {
    super(
      'This file isn\'t saved as UTF-8, so accented letters (Vietnamese, for example) would come out wrong. In Excel, use File > Save As > "CSV UTF-8 (Comma delimited)"; in Google Sheets, File > Download > CSV. Then import it again.',
    );
  }
}

/**
 * Reads a picked file's bytes as UTF-8, strictly: bytes that aren't valid
 * UTF-8 throw NotUtf8Error instead of turning into replacement characters.
 */
export function decodeCsvFile(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new NotUtf8Error();
  }
}

/** Parses CSV text (RFC 4180: quoted fields, "" for a quote, CRLF or LF). Blank lines are skipped. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

/** Writes rows as CSV, quoting only fields that need it. */
export function toCsv(rows: string[][]): string {
  const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** The whole menu in the import format, so an export can be edited and imported back. */
export function menuToCsv(categories: Category[], dishes: Dish[]): string {
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const rows = dishes.map((d) => [
    categoryName.get(d.catId) ?? "",
    d.name,
    String(d.price),
    TAX_CODE_OF[d.taxMode],
    d.taxMode === "include" ? d.taxName || COMMON_TAX : d.taxMode === "exclude" ? String(d.taxPct ?? 0) : "",
    d.description ?? "",
    d.imageUrl ?? "",
    d.isVegan ? "1" : "0",
    STATUS_CODE_OF[d.status],
  ]);
  return toCsv([[...MENU_CSV_COLUMNS], ...rows]);
}

/** One dish read from the file, ready to save (the category by name). */
export interface MenuRow {
  line: number;
  category: string;
  name: string;
  price: number;
  taxMode: TaxMode;
  taxName?: string;
  taxPct?: number;
  description?: string;
  imageUrl?: string;
  isVegan: boolean;
  status: DishStatus;
}

export interface MenuRowError {
  /** The file's line number (the header is line 1). */
  line: number;
  message: string;
}

const YES = new Set(["1", "yes", "true", "y"]);
const NO = new Set(["", "0", "no", "false", "n"]);
const key = (s: string) => s.normalize("NFC").trim().toLowerCase();

/**
 * Reads and checks a menu file. Every problem is reported with its line, so the
 * owner can fix the file; rows are only usable when there are no errors.
 * `specialTaxNames` are the taxes a "1" (included) row may name besides the common tax.
 */
export function parseMenuCsv(
  text: string,
  specialTaxNames: string[],
): { rows: MenuRow[]; errors: MenuRowError[] } {
  // One form for accented letters (NFC): a file saved with decomposed accents
  // (as macOS can) still matches the same names already on the menu.
  const table = parseCsv(text.normalize("NFC"));
  if (!table.length) return { rows: [], errors: [{ line: 1, message: "The file is empty." }] };

  const header = table[0].map(key);
  const missing = MENU_CSV_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) {
    return {
      rows: [],
      errors: [{ line: 1, message: `Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.` }],
    };
  }
  const col = Object.fromEntries(MENU_CSV_COLUMNS.map((c) => [c, header.indexOf(c)])) as Record<
    (typeof MENU_CSV_COLUMNS)[number],
    number
  >;
  const taxNames = new Map([COMMON_TAX, ...specialTaxNames].map((n) => [key(n), n]));

  const rows: MenuRow[] = [];
  const errors: MenuRowError[] = [];
  const seen = new Set<string>();

  table.slice(1).forEach((cells, i) => {
    const line = i + 2;
    const get = (c: (typeof MENU_CSV_COLUMNS)[number]) => (cells[col[c]] ?? "").trim();
    const fail = (message: string) => errors.push({ line, message });
    const before = errors.length;

    const category = get("category");
    const name = get("name");
    if (!category) fail("Category is required.");
    if (!name) fail("Dish name is required.");

    const priceText = get("price");
    const price = Number(priceText);
    if (!priceText || !Number.isFinite(price) || price < 0) fail("Price must be a number, 0 or more.");

    const taxMode = TAX_CODES[get("tax") || "0"];
    let taxName: string | undefined;
    let taxPct: number | undefined;
    if (!taxMode) fail("Tax must be 0 (none), 1 (included) or 2 (added at checkout).");
    else if (taxMode === "include") {
      taxName = taxNames.get(key(get("tax_value") || COMMON_TAX));
      if (!taxName) {
        fail(`Tax value must be "${COMMON_TAX}" or one of your special taxes (${specialTaxNames.join(", ") || "none yet"}).`);
      }
    } else if (taxMode === "exclude") {
      const v = get("tax_value");
      taxPct = Number(v);
      if (!v || !Number.isFinite(taxPct) || taxPct < 0 || taxPct > MAX_SPECIAL_TAX) {
        fail(`Tax value must be a percentage from 0 to ${MAX_SPECIAL_TAX}.`);
      }
    }

    const photo = get("photo");
    if (photo && !/^https:\/\/\S+$/i.test(photo)) fail("Photo must be an https:// link (Vercel Blob or S3).");

    const vegan = key(get("is_vegan"));
    if (!YES.has(vegan) && !NO.has(vegan)) fail("is_vegan must be 1 or 0.");

    const status = STATUS_CODES[get("status") || "2"];
    if (!status) fail("Status must be 0 (hidden), 1 (sold out) or 2 (available).");

    const dup = `${key(category)}\u0000${key(name)}`;
    if (category && name) {
      if (seen.has(dup)) fail(`"${name}" appears twice in ${category}.`);
      seen.add(dup);
    }

    if (errors.length === before) {
      rows.push({
        line,
        category,
        name,
        price,
        taxMode: taxMode!,
        taxName,
        taxPct,
        description: get("description") || undefined,
        imageUrl: photo || undefined,
        isVegan: YES.has(vegan),
        status: status!,
      });
    }
  });

  if (table.length === 1) errors.push({ line: 2, message: "The file has no dishes." });
  return { rows, errors };
}

/** What an import will do: categories to create, dishes to add, and existing dishes to update. */
export interface ImportPlan {
  newCategories: string[];
  add: MenuRow[];
  update: { id: string; row: MenuRow }[];
}

/**
 * Matches rows to the current menu by category and dish name (ignoring case):
 * a match updates that dish, anything else is added. Nothing is deleted.
 */
export function planMenuImport(rows: MenuRow[], categories: Category[], dishes: Dish[]): ImportPlan {
  const catByName = new Map(categories.map((c) => [key(c.name), c]));
  const newCategories: string[] = [];
  const add: MenuRow[] = [];
  const update: { id: string; row: MenuRow }[] = [];
  for (const row of rows) {
    const cat = catByName.get(key(row.category));
    if (!cat) {
      if (!newCategories.some((n) => key(n) === key(row.category))) newCategories.push(row.category);
      add.push(row);
      continue;
    }
    const existing = dishes.find((d) => d.catId === cat.id && key(d.name) === key(row.name));
    if (existing) update.push({ id: existing.id, row });
    else add.push(row);
  }
  return { newCategories, add, update };
}
