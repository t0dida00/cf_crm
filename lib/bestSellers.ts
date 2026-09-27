import type { Category, Dish } from "./types";

/** How many dishes get the "Best seller" tag (matches the backend's public menu). */
export const BEST_SELLER_COUNT = 5;

/**
 * Ids of the most-ordered dishes guests can see (not hidden, in an active
 * category), highest `soldCount` first, ties by name. Dishes that have never
 * sold are never tagged. Mirrors the backend's pick for the guest menu, so
 * staff and guests see the same tags.
 */
export function bestSellerIds(
  dishes: Dish[],
  categories: Category[],
  limit = BEST_SELLER_COUNT,
): Set<string> {
  const activeCategories = new Set(categories.filter((c) => c.valid).map((c) => c.id));
  return new Set(
    dishes
      .filter((d) => d.status !== "hidden" && activeCategories.has(d.catId) && (d.soldCount ?? 0) > 0)
      .sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0) || a.name.localeCompare(b.name))
      .slice(0, limit)
      .map((d) => d.id),
  );
}
