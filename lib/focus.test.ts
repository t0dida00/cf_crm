import { afterEach, describe, expect, test, vi } from "vitest";
import { focusFirstInvalid } from "./focus";

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("focusFirstInvalid", () => {
  test("focuses the first invalid field once the errors have rendered", async () => {
    document.body.innerHTML = `<form><input id="a"><input id="b" aria-invalid="true"><input id="c" aria-invalid="true"></form>`;
    focusFirstInvalid(document.querySelector("form"));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(document.activeElement?.id).toBe("b");
  });

  test("does nothing without an invalid field or a root", async () => {
    document.body.innerHTML = `<form><input id="a"></form>`;
    focusFirstInvalid(document.querySelector("form"));
    focusFirstInvalid(null);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(document.activeElement).toBe(document.body);
  });
});
