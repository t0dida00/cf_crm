import { afterEach, describe, expect, test, vi } from "vitest";
import { registerAccount } from "./register";

afterEach(() => vi.restoreAllMocks());

const answer = (status: number, body: object) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));
const input = { fullName: "Ana Ruiz", email: "ana@example.com", password: "longenough" };

describe("registerAccount", () => {
  test("reports whether the new account waits for review", async () => {
    answer(201, { pendingApproval: true, user: {} });
    await expect(registerAccount(input)).resolves.toEqual({ ok: true, pendingApproval: true });
    answer(201, { token: "t", pendingApproval: false, user: {} });
    await expect(registerAccount(input)).resolves.toEqual({ ok: true, pendingApproval: false });
  });

  test("maps a taken email and invalid input", async () => {
    answer(409, { error: "exists" });
    await expect(registerAccount(input)).resolves.toEqual({ ok: false, error: "exists" });
    answer(400, { error: "A valid email is required" });
    await expect(registerAccount(input)).resolves.toEqual({ ok: false, error: "invalid", message: "A valid email is required" });
  });
});
