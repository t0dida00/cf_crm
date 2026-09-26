import { describe, expect, test } from "vitest";
import { bestSellerIds } from "./best-sellers";
import type { Category, Dish } from "./types";

const cats: Category[] = [
  { id: "on", name: "Food", valid: true },
  { id: "off", name: "Seasonal", valid: false },
];
const dish = (id: string, soldCount: number, over: Partial<Dish> = {}): Dish => ({
  id,
  name: id,
  price: 1,
  catId: "on",
  status: "valid",
  taxMode: "none",
  soldCount,
  ...over,
});

describe("bestSellerIds", () => {
  test("picks the top 5 by soldCount", () => {
    const dishes = [dish("a", 1), dish("b", 9), dish("c", 4), dish("d", 7), dish("e", 2), dish("f", 8)];
    expect([...bestSellerIds(dishes, cats)]).toEqual(["b", "f", "d", "c", "e"]);
  });

  test("skips dishes that have not sold or have no count", () => {
    const dishes = [dish("a", 0), dish("b", 3), { ...dish("c", 0), soldCount: undefined }];
    expect([...bestSellerIds(dishes, cats)]).toEqual(["b"]);
  });

  test("skips hidden dishes and dishes in inactive categories", () => {
    const dishes = [
      dish("hidden", 50, { status: "hidden" }),
      dish("off-menu", 40, { catId: "off" }),
      dish("sold-out", 30, { status: "sold_out" }),
      dish("ok", 1),
    ];
    expect([...bestSellerIds(dishes, cats)]).toEqual(["sold-out", "ok"]);
  });

  test("breaks ties by name", () => {
    const dishes = [dish("1", 5, { name: "Tea" }), dish("2", 5, { name: "Coffee" }), dish("3", 5, { name: "Juice" })];
    expect([...bestSellerIds(dishes, cats, 2)]).toEqual(["2", "3"]);
  });
});
