import type { Domain } from "./types";

export interface DomainLexicon {
  label: string;
  blurb: string;
  zones: string[];
  categories: { name: string; dishes: [string, number, string][] }[];
  flow: string[];
}

export const LEXICON: Record<Domain, DomainLexicon> = {
  restaurant: {
    label: "Restaurant",
    blurb: "Covers, tables, kitchen",
    zones: ["Main hall", "Terrace", "Bar"],
    categories: [
      {
        name: "Starters",
        dishes: [
          ["Pan con tomate", 5.5, "Toasted sourdough, tomato, olive oil"],
          ["Padrón peppers", 7, "Blistered, sea salt"],
          ["Iberian ham plate", 14, "24-month cured, 80g"],
        ],
      },
      {
        name: "Mains",
        dishes: [
          ["Seafood paella", 19.5, "For one · 25 min · prawn, mussel, squid"],
          ["Grilled sea bass", 22, "Whole fish, lemon, roast potatoes"],
          ["Ribeye 300g", 26, "Served medium rare unless asked"],
        ],
      },
      {
        name: "Desserts",
        dishes: [
          ["Crema catalana", 6.5, "Burnt cinnamon sugar"],
          ["Cheesecake", 6, "Basque style, lightly burnt"],
        ],
      },
    ],
    flow: ["New", "Preparing", "Served", "Paid"],
  },
  cafe: {
    label: "Café / Bakery",
    blurb: "Counter and table service",
    zones: ["Window", "Back room", "Counter"],
    categories: [
      {
        name: "Coffee",
        dishes: [
          ["Flat white", 3.2, "Double shot, steamed milk"],
          ["Cortado", 2.4, "Espresso cut with warm milk"],
          ["Filter batch", 3, "Rotating single origin"],
        ],
      },
      {
        name: "Bakery",
        dishes: [
          ["Almond croissant", 3.6, "Twice-baked, almond cream"],
          ["Sourdough loaf", 4.8, "48-hour ferment, whole loaf"],
          ["Cinnamon bun", 3.9, "Cardamom sugar, cream cheese glaze"],
        ],
      },
      {
        name: "Brunch",
        dishes: [
          ["Avocado toast", 9.5, "Sourdough, chilli oil, lime"],
          ["Eggs benedict", 11, "Poached eggs, hollandaise, muffin"],
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

export const SLOT_TIMES = [
  "09:30",
  "11:00",
  "12:30",
  "14:00",
  "16:30",
  "19:00",
  "20:30",
];
