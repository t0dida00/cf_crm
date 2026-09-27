import { describe, expect, test } from "vitest";
import { safeCallbackPath } from "./safe-redirect";

describe("safeCallbackPath", () => {
  test.each(["/admin", "/staff?tab=orders", "/admin?tab=menu#top"])("keeps the app path %s", (p) => {
    expect(safeCallbackPath(p)).toBe(p);
  });

  test.each([
    "https://evil.example/login",
    "//evil.example",
    "/\\evil.example",
    "/\\\\evil.example",
    "javascript:alert(1)",
    "evil.example",
    "/ad\nmin",
    "",
    null,
    undefined,
  ])("refuses %p", (p) => {
    expect(safeCallbackPath(p as string)).toBeNull();
  });
});
