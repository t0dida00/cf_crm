import { t } from "./i18n";
import type { Messages } from "./i18n/messages";

/**
 * Form rules shared by every form that asks for these fields. The backend
 * (CRM_backend/src/lib/validation.ts) enforces the same rules; change both together.
 */

/** A field's name inside a message: a key under validation.fields. */
export type FieldName = keyof Messages["validation"]["fields"];

const field = (name: FieldName) => t(`validation.fields.${name}`);

/**
 * Messages in the language in use, built when a form is checked (so a
 * language switch applies to the next check). English starts sentences with
 * the field ("Phone is required."); Vietnamese words it its own way.
 */
export const MESSAGES = {
  get phone() {
    return t("validation.phone");
  },
  get email() {
    return t("validation.email");
  },
  get fullName() {
    return t("validation.fullName");
  },
  get password() {
    return t("validation.password");
  },
  required: (name: FieldName) => t("validation.required", { field: field(name) }),
  /** For a field picked from a list, not typed ("Vui lòng chọn…"). */
  requiredChoice: (name: FieldName) => t("validation.requiredChoice", { field: field(name) }),
  get price() {
    return t("validation.price");
  },
  get seats() {
    return t("validation.seats");
  },
  count: (name: FieldName) => t("validation.count", { field: field(name) }),
  percent: (name: FieldName) => t("validation.percent", { field: field(name) }),
  percentMax: (name: FieldName, max: number) => t("validation.percentMax", { field: field(name), max }),
};

/** Digits, with an optional leading +; spaces between groups are allowed ("+34 600 000 000"). 6–15 digits. */
export function isValidPhone(value: string): boolean {
  const v = value.trim();
  if (!/^\+?[0-9][0-9 ]*$/.test(v)) return false;
  const digits = v.replace(/\D/g, "").length;
  return digits >= 6 && digits <= 15;
}

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());

/** At least two words, e.g. "Ana Ruiz". */
export const isFullName = (value: string) => value.trim().split(/\s+/).filter(Boolean).length >= 2;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

const phoneError = (phone: string) =>
  !phone.trim() ? MESSAGES.required("phone") : isValidPhone(phone) ? undefined : MESSAGES.phone;
const emailError = (email: string) =>
  !email.trim() ? MESSAGES.required("email") : isValidEmail(email) ? undefined : MESSAGES.email;
const fullNameError = (name: string) =>
  !name.trim() ? MESSAGES.required("fullName") : isFullName(name) ? undefined : MESSAGES.fullName;

/** Drops fields without an error, so `Object.keys(errors).length === 0` means valid. */
const compact = <K extends string>(errors: Record<K, string | undefined>): FieldErrors<K> =>
  Object.fromEntries(Object.entries(errors).filter(([, v]) => v)) as FieldErrors<K>;

export function validateSignup(f: { fullName: string; email: string; password: string }) {
  return compact({
    fullName: fullNameError(f.fullName),
    email: emailError(f.email),
    password: f.password.length >= 8 ? undefined : MESSAGES.password,
  });
}

/** Staff account form. On edit, a blank password keeps the current one. */
export function validateStaff(
  f: { fullName: string; email: string; phone: string; password: string },
  { editing = false } = {},
) {
  const passwordOk = editing ? !f.password || f.password.length >= 8 : f.password.length >= 8;
  return compact({
    fullName: fullNameError(f.fullName),
    email: emailError(f.email),
    phone: phoneError(f.phone),
    password: passwordOk ? undefined : MESSAGES.password,
  });
}

/** Business details: workspace setup and Settings. */
export function validateBusiness(f: { name: string; phone: string; address: string }) {
  return compact({
    name: f.name.trim() ? undefined : MESSAGES.required("businessName"),
    phone: phoneError(f.phone),
    address: f.address.trim() ? undefined : MESSAGES.required("address"),
  });
}

export function validateDish(f: { name: string; price: string; catId: string; taxPct?: string }) {
  const price = f.price.trim();
  return compact({
    taxPct: percentError(f.taxPct ?? "", "tax", MAX_SPECIAL_TAX),
    name: f.name.trim() ? undefined : MESSAGES.required("name"),
    price: !price ? MESSAGES.required("price") : Number.isFinite(Number(price)) && Number(price) >= 0 ? undefined : MESSAGES.price,
    catId: f.catId ? undefined : MESSAGES.requiredChoice("category"),
  });
}

/** A count (seats, party size, quantity): a whole number, at least 1. */
export const isWholeFromOne = (value: string) => /^\d+$/.test(value.trim()) && Number(value) >= 1;
export const isValidSeats = isWholeFromOne;

/** A count field's error: required, then a whole number from 1. */
export const countError = (value: string, name: FieldName) =>
  !value.trim() ? MESSAGES.required(name) : isWholeFromOne(value) ? undefined : MESSAGES.count(name);

/** Highest allowed rates: the common tax and special (per-dish) taxes. */
export const MAX_COMMON_TAX = 100;
export const MAX_SPECIAL_TAX = 200;

/** A percentage or amount that can be 0 but never negative (and at most `max`). Blank is treated as 0. */
export const percentError = (value: string, name: FieldName, max?: number) => {
  const v = value.trim();
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return MESSAGES.percent(name);
  return max !== undefined && n > max ? MESSAGES.percentMax(name, max) : undefined;
};

/** Table form: name and seats are required; the zone is optional. */
export function validateTable(f: { name: string; seats: string }) {
  return compact({
    name: f.name.trim() ? undefined : MESSAGES.required("tableName"),
    seats: !f.seats.trim() ? MESSAGES.required("seats") : isValidSeats(f.seats) ? undefined : MESSAGES.seats,
  });
}

export function validateCategory(f: { name: string }) {
  return compact({ name: f.name.trim() ? undefined : MESSAGES.required("categoryName") });
}

/** Booking form: guest name and party size (a whole number from 1). */
export function validateBooking(f: { name: string; party: string }) {
  return compact({
    name: f.name.trim() ? undefined : MESSAGES.required("guestName"),
    party: countError(f.party, "partySize"),
  });
}

/**
 * onKeyDown for number inputs that must never go negative: blocks the keys a
 * browser's number field would otherwise accept ("-", "+", "e"), and "." for
 * whole-number counts.
 */
export const blockInvalidNumberKeys =
  ({ whole = false } = {}) =>
  (e: { key: string; preventDefault: () => void }) => {
    if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E" || (whole && (e.key === "." || e.key === ","))) {
      e.preventDefault();
    }
  };

/**
 * Keeps only what a phone number may contain, as the user types or pastes:
 * digits, spaces, and one "+" at the very start. "sadsa" becomes "",
 * "+34 (600) 000" becomes "+34 600 000".
 */
export function sanitizePhone(value: string): string {
  const plus = value.trimStart().startsWith("+") ? "+" : "";
  return plus + value.replace(/[^\d ]/g, "").replace(/ {2,}/g, " ").trimStart();
}

/**
 * For number inputs with a ceiling (tax rates): the value to keep after a
 * change, or null to ignore the keystroke. Rejects anything above `max`, and
 * tidies leading zeros ("0100" -> "100", but "0.5" stays).
 */
export function acceptNumberInput(value: string, max: number): string | null {
  if (value === "") return "";
  if (!/^\d*\.?\d*$/.test(value)) return null;
  const tidy = value.replace(/^0+(?=\d)/, "");
  const n = Number(tidy);
  if (!Number.isFinite(n) || n > max) return null;
  return tidy;
}

/**
 * Updates one field's error (e.g. when the user leaves the field), leaving
 * the others as they are: `setErrors((e) => withFieldError(e, "phone", validateX(form).phone))`.
 */
export function withFieldError<K extends string>(errors: FieldErrors<K>, field: K, message: string | undefined): FieldErrors<K> {
  const next = { ...errors };
  if (message) next[field] = message;
  else delete next[field];
  return next;
}
