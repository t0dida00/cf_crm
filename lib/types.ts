export type Domain = "restaurant" | "cafe";
export type TabId =
  | "dash"
  | "tables"
  | "categories"
  | "menu"
  | "orders"
  | "bookings"
  | "settings";

export type TaxMode = "none" | "include" | "exclude";

export interface TableRec {
  id: string;
  name: string;
  seats: number;
  zone: string;
}

export interface Category {
  id: string;
  name: string;
  valid: boolean;
}

export interface Dish {
  id: string;
  name: string;
  price: number;
  catId: string;
  valid: boolean;
  taxMode: TaxMode;
  /** Name of the tax baked into the price when taxMode === "include". */
  taxName?: string;
  /** Percentage added at checkout when taxMode === "exclude". */
  taxPct?: number;
}

export interface OrderLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  code: string;
  tableName: string;
  lines: OrderLine[];
  total: number;
  /** Checkout timestamp (ms). */
  ts: number;
  status: string;
}

export interface Booking {
  id: string;
  name: string;
  time: string;
  party: number;
  tableName: string;
  status: "Confirmed" | "Arrived";
  /** Start of the booked day (ms). */
  ts: number;
}

export interface SpecialTax {
  name: string;
  pct: number;
}

export interface Settings {
  taxRate: number;
  currency: string;
  specialTaxes: SpecialTax[];
}

export interface Workspace {
  name: string;
  domain: Domain;
  zones: string[];
  tables: TableRec[];
  categories: Category[];
  dishes: Dish[];
  orders: Order[];
  bookings: Booking[];
  settings: Settings;
}

export type RangeId = "today" | "week" | "month" | "year" | "all" | "custom";
