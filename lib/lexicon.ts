import type { Domain } from "./types";
import type { Messages } from "./i18n/messages";

type LexiconText = Messages["lexicon"];
export type ZoneKey = keyof LexiconText["zones"];
export type CategoryKey = keyof LexiconText["categories"];
export type DishKey = keyof LexiconText["dishes"];

/**
 * Each business type's sample content. Words live in the translation files
 * (`lexicon.*`), so the landing page's sample menu reads in the visitor's
 * language; here are only ids, prices and the order flow.
 */
export interface DomainLexicon {
  zones: ZoneKey[];
  categories: { id: CategoryKey; dishes: { id: DishKey; price: number }[] }[];
  /** Order statuses in order. Stored on orders as these English words; shown via `common.status.*`. */
  flow: string[];
}

export const LEXICON: Record<Domain, DomainLexicon> = {
  restaurant: {
    zones: ["mainHall", "terrace", "bar"],
    categories: [
      {
        id: "starters",
        dishes: [
          { id: "panConTomate", price: 5.5 },
          { id: "padron", price: 7 },
          { id: "iberianHam", price: 14 },
        ],
      },
      {
        id: "mains",
        dishes: [
          { id: "seafoodPaella", price: 19.5 },
          { id: "seaBass", price: 22 },
          { id: "ribeye", price: 26 },
        ],
      },
      {
        id: "desserts",
        dishes: [
          { id: "cremaCatalana", price: 6.5 },
          { id: "cheesecake", price: 6 },
        ],
      },
    ],
    flow: ["New", "Preparing", "Served", "Paid"],
  },
  cafe: {
    zones: ["window", "backRoom", "counter"],
    categories: [
      {
        id: "coffee",
        dishes: [
          { id: "flatWhite", price: 3.2 },
          { id: "cortado", price: 2.4 },
          { id: "filterBatch", price: 3 },
        ],
      },
      {
        id: "bakery",
        dishes: [
          { id: "almondCroissant", price: 3.6 },
          { id: "sourdoughLoaf", price: 4.8 },
          { id: "cinnamonBun", price: 3.9 },
        ],
      },
      {
        id: "brunch",
        dishes: [
          { id: "avocadoToast", price: 9.5 },
          { id: "eggsBenedict", price: 11 },
        ],
      },
    ],
    flow: ["New", "Preparing", "Ready", "Paid"],
  },
};

export const GUESTS = [
  "Marta Rius",
  "D. Okafor",
  "Chen family",
  "L. Fernández",
  "Priya N.",
  "T. Andersen",
  "J. Whitfield",
];

// Booking slots are generated (every 15 minutes) in lib/booking-slots.ts.
export { SLOT_TIMES } from "./bookingSlots";
