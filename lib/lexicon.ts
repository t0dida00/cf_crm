import type { Domain } from "./types";

export interface DomainLexicon {
  label: string;
  blurb: string;
  zones: string[];
  categories: { name: string; dishes: [string, number][] }[];
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
          ["Pan con tomate", 5.5],
          ["Padrón peppers", 7],
          ["Iberian ham plate", 14],
        ],
      },
      {
        name: "Mains",
        dishes: [
          ["Seafood paella", 19.5],
          ["Grilled sea bass", 22],
          ["Ribeye 300g", 26],
        ],
      },
      {
        name: "Desserts",
        dishes: [
          ["Crema catalana", 6.5],
          ["Cheesecake", 6],
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
          ["Flat white", 3.2],
          ["Cortado", 2.4],
          ["Filter batch", 3],
        ],
      },
      {
        name: "Bakery",
        dishes: [
          ["Almond croissant", 3.6],
          ["Sourdough loaf", 4.8],
          ["Cinnamon bun", 3.9],
        ],
      },
      {
        name: "Brunch",
        dishes: [
          ["Avocado toast", 9.5],
          ["Eggs benedict", 11],
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
