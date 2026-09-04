import { GUESTS, LEXICON, SLOT_TIMES } from "./lexicon";
import type {
  Booking,
  Category,
  Dish,
  Domain,
  Order,
  TableRec,
  Workspace,
} from "./types";

/** Deterministic PRNG so the seeded history is stable across renders. */
function makeRandom(seed = 987654321) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function seedWorkspace(
  name: string,
  domain: Domain,
  withDemoData = true,
): Workspace {
  const lex = LEXICON[domain];
  const base: Workspace = {
    name,
    domain,
    zones: [...lex.zones],
    tables: [],
    categories: [],
    dishes: [],
    orders: [],
    bookings: [],
    settings: { taxRate: 10, currency: "€", specialTaxes: [] },
  };
  if (!withDemoData) return base;

  const seats = [2, 2, 4, 4, 6, 8];
  const tables: TableRec[] = seats.map((n, i) => ({
    id: `t${i}`,
    name: `Table ${i + 1}`,
    seats: n,
    zone: lex.zones[i % lex.zones.length],
  }));

  const categories: Category[] = lex.categories.map((c, i) => ({
    id: `c${i}`,
    name: c.name,
    valid: true,
  }));

  const dishes: Dish[] = [];
  lex.categories.forEach((c, ci) =>
    c.dishes.forEach(([dishName, price], k) =>
      dishes.push({
        id: `d${ci}${k}`,
        catId: `c${ci}`,
        name: dishName,
        price,
        valid: true,
        taxMode: "none",
      }),
    ),
  );

  const rnd = makeRandom();
  const now = new Date();
  const orders: Order[] = [];
  for (let day = 0; day < 400; day++) {
    const perDay = day === 0 ? 6 : (rnd() < 0.55 ? 1 : 0) + Math.floor(rnd() * 3);
    for (let k = 0; k < perDay; k++) {
      const when = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - day,
        11 + Math.floor(rnd() * 11),
        Math.floor(rnd() * 60),
      );
      if (when > now) continue;
      const lines: Order["lines"] = [];
      const n = 1 + Math.floor(rnd() * 3);
      for (let j = 0; j < n; j++) {
        const dish = dishes[Math.floor(rnd() * dishes.length)];
        const qty = 1 + Math.floor(rnd() * 2);
        const existing = lines.find((l) => l.itemId === dish.id);
        if (existing) existing.qty += qty;
        else lines.push({ itemId: dish.id, name: dish.name, price: dish.price, qty });
      }
      const table = tables[Math.floor(rnd() * tables.length)];
      orders.push({
        id: `o${orders.length}`,
        code: `ORD-${2400 - orders.length}`,
        tableName: table.name,
        lines,
        total: lines.reduce((a, l) => a + l.price * l.qty, 0),
        ts: when.getTime(),
        status: day === 0 && k < 2 ? lex.flow[k] : lex.flow[3],
      });
    }
  }
  orders.sort((a, b) => b.ts - a.ts);

  const today = startOfDay(now);
  const bookings: Booking[] = [0, 1, 2, 3, 4].map((i) => ({
    id: `b${i}`,
    time: SLOT_TIMES[i + 1],
    name: GUESTS[i],
    party: 2 + (i % 4),
    tableName: tables[i].name,
    status: i < 2 ? "Arrived" : "Confirmed",
    ts: today,
  }));
  for (let day = 1; day < 400; day++) {
    const ts = startOfDay(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() - day),
    );
    const n = 1 + Math.floor(rnd() * 5);
    for (let k = 0; k < n; k++) {
      bookings.push({
        id: `bh${day}-${k}`,
        time: SLOT_TIMES[Math.floor(rnd() * SLOT_TIMES.length)],
        name: GUESTS[Math.floor(rnd() * GUESTS.length)],
        party: 2 + Math.floor(rnd() * 5),
        tableName: tables[Math.floor(rnd() * tables.length)].name,
        status: "Arrived",
        ts,
      });
    }
  }

  return { ...base, tables, categories, dishes, orders, bookings };
}
