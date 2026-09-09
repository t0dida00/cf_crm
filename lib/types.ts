export type Domain = "restaurant" | "cafe";
export type TabId =
  | "dash"
  | "tables"
  | "categories"
  | "menu"
  | "orders"
  | "bookings"
  | "staff"
  | "settings";

export type TaxMode = "none" | "include" | "exclude";

export type TableState = "Free" | "Booked" | "Seated" | "Finished";

export interface TableRec {
  id: string;
  name: string;
  seats: number;
  zone: string;
  state: TableState;
  /** When the table was seated (ms), or null when not seated. */
  seatedAt: number | null;
}

export interface Category {
  id: string;
  name: string;
  valid: boolean;
}

export interface StaffAccount {
  /** platform_users row id — use this for edit/disable calls. */
  id: string;
  userId: string;
  email: string | null;
  fullName: string;
  isActive: boolean;
  createdAt: number;
}

export interface Dish {
  id: string;
  name: string;
  price: number;
  catId: string;
  valid: boolean;
  taxMode: TaxMode;
  /** Short menu description shown to guests, e.g. ingredients or prep notes. */
  description?: string;
  /** Name of the tax baked into the price when taxMode === "include". */
  taxName?: string;
  /** Percentage added at checkout when taxMode === "exclude". */
  taxPct?: number;
  isVegan?: boolean;
  imageUrl?: string;
}

export interface OrderLine {
  /** Order-line row id (absent for lines that only exist as a local optimistic draft). */
  id?: string;
  itemId: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
}

export interface Order {
  id: string;
  code: string;
  tableName: string;
  lines: OrderLine[];
  total: number;
  /** Tax rate (%) in effect when this order was placed — fixed at creation, so
   * later changes to platform settings never alter a past order's Net/Tax split. */
  taxRate: number;
  /** Opened timestamp (ms). */
  ts: number;
  status: string;
  /** Checked-out timestamp (ms), or null while still open. */
  closedTs: number | null;
}

export interface Booking {
  id: string;
  name: string;
  time: string;
  party: number;
  /** Assigned table name, or null while awaiting assignment. */
  tableName: string | null;
  status: "Confirmed" | "Arrived";
  /** Start of the booked day (ms). */
  ts: number;
}

export interface SpecialTax {
  id: string;
  name: string;
  pct: number;
}

export interface Settings {
  taxRate: number;
  currency: string;
  specialTaxes: SpecialTax[];
}

export interface Workspace {
  id: string | null;
  name: string;
  domain: Domain;
  phone?: string;
  email?: string;
  address?: string;
  zones: string[];
  tables: TableRec[];
  categories: Category[];
  dishes: Dish[];
  orders: Order[];
  bookings: Booking[];
  settings: Settings;
}

export type RangeId = "today" | "week" | "month" | "year" | "all" | "custom";

export type TableRequestType = "call_staff" | "checkout";

export interface TableRequest {
  id: string;
  tableName: string;
  type: TableRequestType;
  status: "pending" | "resolved";
  /** Created timestamp (ms). */
  ts: number;
  resolvedTs: number | null;
}
