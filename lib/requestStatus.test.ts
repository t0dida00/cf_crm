import { describe, expect, test } from "vitest";
import { errorMessage, toRequestStatus } from "./requestStatus";

describe("toRequestStatus", () => {
  test("maps query states", () => {
    expect(toRequestStatus({ status: "success", fetchStatus: "idle" })).toBe("success");
    expect(toRequestStatus({ status: "error", fetchStatus: "idle" })).toBe("error");
    expect(toRequestStatus({ status: "pending", fetchStatus: "fetching" })).toBe("loading");
  });

  test("treats a pending query that isn't fetching (disabled) as idle", () => {
    expect(toRequestStatus({ status: "pending", fetchStatus: "idle" })).toBe("idle");
  });
});

describe("errorMessage", () => {
  test("uses the error's message, or the fallback", () => {
    expect(errorMessage(new Error("Boom"))).toBe("Boom");
    expect(errorMessage("nope", "Fallback")).toBe("Fallback");
    expect(errorMessage(new Error(""), "Fallback")).toBe("Fallback");
  });
});
