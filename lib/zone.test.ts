import { describe, expect, test } from "vitest";
import { hasZone } from "./zone";

describe("hasZone", () => {
  test("a named zone counts; blank and the dash placeholder don't", () => {
    expect(hasZone("Terrace")).toBe(true);
    expect(hasZone("")).toBe(false);
    expect(hasZone("  ")).toBe(false);
    expect(hasZone("—")).toBe(false);
  });
});
