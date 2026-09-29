import type { Category, Dish, DishStatus, TaxMode } from "./types";
import { MAX_SPECIAL_TAX } from "./validation";
import { parseCsv, toCsv } from "./csv";
import { t } from "./i18n";

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
/** Other names accepted for the common tax in the file ("Thuế chung"). */
const COMMON_TAX_ALIASES = ["Thuế chung"];

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
  if (!table.length) return { rows: [], errors: [{ line: 1, message: t("admin.csv.empty") }] };

  const header = table[0].map(key);
  const missing = MENU_CSV_COLUMNS.filter((c) => !header.includes(c));
  if (missing.length) {
    return {
      rows: [],
      errors: [{ line: 1, message: t("admin.csv.missing", { count: missing.length, cols: missing.join(", ") }) }],
    };
  }
  const col = Object.fromEntries(MENU_CSV_COLUMNS.map((c) => [c, header.indexOf(c)])) as Record<
    (typeof MENU_CSV_COLUMNS)[number],
    number
  >;
  const taxNames = new Map([COMMON_TAX, ...specialTaxNames].map((n) => [key(n), n]));
  // The common tax in any language we speak (it's stored as "Common tax").
  for (const alias of COMMON_TAX_ALIASES) taxNames.set(key(alias), COMMON_TAX);

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
    if (!category) fail(t("admin.csv.categoryRequired"));
    if (!name) fail(t("admin.csv.nameRequired"));

    const priceText = get("price");
    const price = Number(priceText);
    if (!priceText || !Number.isFinite(price) || price < 0) fail(t("admin.csv.price"));

    const taxMode = TAX_CODES[get("tax") || "0"];
    let taxName: string | undefined;
    let taxPct: number | undefined;
    if (!taxMode) fail(t("admin.csv.tax"));
    else if (taxMode === "include") {
      taxName = taxNames.get(key(get("tax_value") || COMMON_TAX));
      if (!taxName) {
        fail(t("admin.csv.taxName", { common: COMMON_TAX, taxes: specialTaxNames.join(", ") || t("admin.csv.noneYet") }));
      }
    } else if (taxMode === "exclude") {
      const v = get("tax_value");
      taxPct = Number(v);
      if (!v || !Number.isFinite(taxPct) || taxPct < 0 || taxPct > MAX_SPECIAL_TAX) {
        fail(t("admin.csv.taxPct", { max: MAX_SPECIAL_TAX }));
      }
    }

    const photo = get("photo");
    if (photo && !/^https:\/\/\S+$/i.test(photo)) fail(t("admin.csv.photo"));

    const vegan = key(get("is_vegan"));
    if (!YES.has(vegan) && !NO.has(vegan)) fail(t("admin.csv.vegan"));

    const status = STATUS_CODES[get("status") || "2"];
    if (!status) fail(t("admin.csv.status"));

    const dup = `${key(category)}\u0000${key(name)}`;
    if (category && name) {
      if (seen.has(dup)) fail(t("admin.csv.duplicate", { name, category }));
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

  if (table.length === 1) errors.push({ line: 2, message: t("admin.csv.noDishes") });
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
