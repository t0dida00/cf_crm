import { describe, expect, test, vi } from "vitest";
import {
  isFullName,
  isValidEmail,
  isValidPhone,
  MESSAGES,
  isValidSeats,
  countError,
  percentError,
  validateBooking,
  sanitizePhone,
  blockInvalidNumberKeys,
  acceptNumberInput,
  withFieldError,
  validateBusiness,
  validateCategory,
  validateDish,
  validateTable,
  validateSignup,
  validateStaff,
} from "./validation";

describe("isValidPhone", () => {
  test.each(["+34600000000", "600000000", "+34 600 000 000", "0034 93 123 45 67"])("accepts %s", (v) =>
    expect(isValidPhone(v)).toBe(true),
  );
  test.each(["", "abc", "600-000-000", "+34 (600) 000", "34+600000", "12345", "+", "1234567890123456"])(
    "rejects %p",
    (v) => expect(isValidPhone(v)).toBe(false),
  );
});

describe("isValidEmail", () => {
  test.each(["ana@casa.com", " ana.ruiz+x@sub.casa.es "])("accepts %s", (v) => expect(isValidEmail(v)).toBe(true));
  test.each(["", "ana", "ana@", "ana@casa", "ana @casa.com", "ana@casa.c"])("rejects %p", (v) =>
    expect(isValidEmail(v)).toBe(false),
  );
});

describe("isFullName", () => {
  test("needs at least two words", () => {
    expect(isFullName("Ana Ruiz")).toBe(true);
    expect(isFullName("  Ana   María Ruiz ")).toBe(true);
    expect(isFullName("Ana")).toBe(false);
    expect(isFullName("   ")).toBe(false);
  });
});

describe("form validators", () => {
  test("signup", () => {
    expect(validateSignup({ fullName: "Ana Ruiz", email: "ana@casa.com", password: "longenough" })).toEqual({});
    expect(validateSignup({ fullName: "Ana", email: "nope", password: "short" })).toEqual({
      fullName: MESSAGES.fullName,
      email: MESSAGES.email,
      password: MESSAGES.password,
    });
  });

  test("staff: phone is required; a blank password is fine only when editing", () => {
    const ok = { fullName: "Jamie Rivera", email: "jamie@casa.com", phone: "+34 600 111 222", password: "" };
    expect(validateStaff(ok, { editing: true })).toEqual({});
    expect(validateStaff(ok)).toEqual({ password: MESSAGES.password });
    expect(validateStaff({ ...ok, phone: "" }, { editing: true })).toEqual({ phone: "Phone is required." });
    expect(validateStaff({ ...ok, phone: "call me" }, { editing: true })).toEqual({ phone: MESSAGES.phone });
  });

  test("business: name, phone and address are required", () => {
    expect(validateBusiness({ name: "Casa", phone: "+34 600 000 000", address: "Mar 1" })).toEqual({});
    expect(validateBusiness({ name: " ", phone: "", address: "" })).toEqual({
      name: "Business name is required.",
      phone: "Phone is required.",
      address: "Address is required.",
    });
  });

  test("dish: name, price and category are required", () => {
    expect(validateDish({ name: "Latte", price: "3.5", catId: "c1" })).toEqual({});
    expect(validateDish({ name: "", price: "", catId: "" })).toEqual({
      name: "Name is required.",
      price: "Price is required.",
      catId: "Category is required.",
    });
    expect(validateDish({ name: "Latte", price: "-1", catId: "c1" })).toEqual({ price: MESSAGES.price });
  });
});

describe("tables and categories", () => {
  test("seats are a whole number from 1", () => {
    expect(isValidSeats("1")).toBe(true);
    expect(isValidSeats("12")).toBe(true);
    for (const v of ["0", "-4", "2.5", "", "four"]) expect(isValidSeats(v)).toBe(false);
  });

  test("table: name and seats are required; the zone is optional", () => {
    expect(validateTable({ name: "T1", seats: "4" })).toEqual({});
    expect(validateTable({ name: " ", seats: "-4" })).toEqual({
      name: "Table name is required.",
      seats: MESSAGES.seats,
    });
    expect(validateTable({ name: "T1", seats: "" })).toEqual({ seats: "Seats is required." });
  });

  test("category name is required", () => {
    expect(validateCategory({ name: "Drinks" })).toEqual({});
    expect(validateCategory({ name: "  " })).toEqual({ name: "Category name is required." });
  });
});

describe("counts and percentages", () => {
  test("counts are whole numbers from 1", () => {
    expect(countError("1", "Quantity")).toBeUndefined();
    expect(countError("", "Quantity")).toBe("Quantity is required.");
    for (const v of ["0", "-2", "1.5", "abc"]) expect(countError(v, "Quantity")).toBe(MESSAGES.count("Quantity"));
  });

  test("percentages respect their maximum", () => {
    expect(percentError("100", "Common tax", 100)).toBeUndefined();
    expect(percentError("100.5", "Common tax", 100)).toBe("Common tax can't be more than 100%.");
    expect(percentError("200", "Tax", 200)).toBeUndefined();
    expect(percentError("201", "Tax", 200)).toBe("Tax can't be more than 200%.");
    expect(validateDish({ name: "Latte", price: "3", catId: "c", taxPct: "250" })).toEqual({ taxPct: "Tax can't be more than 200%." });
  });

  test("percentages can be 0 but never negative", () => {
    for (const v of ["", "0", "10", "12.5"]) expect(percentError(v, "Tax")).toBeUndefined();
    for (const v of ["-1", "-0.5", "ten"]) expect(percentError(v, "Tax")).toBe(MESSAGES.percent("Tax"));
  });

  test("booking and dish tax", () => {
    expect(validateBooking({ name: "Ana", party: "2" })).toEqual({});
    expect(validateBooking({ name: "", party: "0" })).toEqual({
      name: "Guest name is required.",
      party: MESSAGES.count("Party size"),
    });
    expect(validateDish({ name: "Latte", price: "3", catId: "c", taxPct: "-5" })).toEqual({ taxPct: MESSAGES.percent("Tax") });
  });
});

describe("sanitizePhone", () => {
  test.each([
    ["sadsadsa", ""],
    ["+34 600 000 000", "+34 600 000 000"],
    ["+34 (600) 000-000", "+34 600 000000"],
    ["34+600", "34600"],
    ["++34", "+34"],
    ["  +34  600", "+34 600"],
  ])("%p -> %p", (input, output) => expect(sanitizePhone(input)).toBe(output));
});

describe("blockInvalidNumberKeys", () => {
  const press = (key: string, whole = false) => {
    const e = { key, preventDefault: vi.fn() };
    blockInvalidNumberKeys({ whole })(e);
    return e.preventDefault.mock.calls.length > 0;
  };
  test("blocks minus, plus and exponent keys; dot only for whole numbers", () => {
    for (const k of ["-", "+", "e", "E"]) expect(press(k)).toBe(true);
    expect(press(".")).toBe(false);
    expect(press(".", true)).toBe(true);
    expect(press("5", true)).toBe(false);
  });
});

describe("acceptNumberInput", () => {
  test.each([
    ["", ""],
    ["10", "10"],
    ["100", "100"],
    ["0100", "100"],
    ["0.5", "0.5"],
    ["12.", "12."],
  ])("keeps %p as %p", (v, out) => expect(acceptNumberInput(v, 100)).toBe(out));

  test.each(["101", "0100000000000000", "150", "-5", "1e3"])("ignores %p above 100 or invalid", (v) =>
    expect(acceptNumberInput(v, 100)).toBeNull(),
  );

  test("special taxes go up to 200", () => {
    expect(acceptNumberInput("200", 200)).toBe("200");
    expect(acceptNumberInput("201", 200)).toBeNull();
  });
});

describe("withFieldError", () => {
  test("sets or clears one field's error and keeps the rest", () => {
    const start = { name: "Name is required.", phone: "Phone is required." };
    expect(withFieldError(start, "phone", undefined)).toEqual({ name: "Name is required." });
    expect(withFieldError(start, "name", "Other")).toEqual({ name: "Other", phone: "Phone is required." });
    expect(start).toEqual({ name: "Name is required.", phone: "Phone is required." });
  });
});
