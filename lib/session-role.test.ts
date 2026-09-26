import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchRole } from "./session-role";

const respond = (status: number, body: unknown = {}) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body), { status }));

afterEach(() => vi.restoreAllMocks());

describe("fetchRole", () => {
  test("returns the role from /platforms/me with the user's token", async () => {
    const spy = respond(200, { role: "OWNER" });
    await expect(fetchRole("jwt-1")).resolves.toBe("OWNER");
    expect(spy.mock.calls[0][0]).toMatch(/\/platforms\/me$/);
    expect((spy.mock.calls[0][1]?.headers as Record<string, string>).Authorization).toBe("Bearer jwt-1");
  });

  test("null when the user has no business yet", async () => {
    respond(404);
    await expect(fetchRole("jwt")).resolves.toBeNull();
  });

  test("undefined (keep the current role) when the backend fails", async () => {
    respond(500);
    await expect(fetchRole("jwt")).resolves.toBeUndefined();
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));
    await expect(fetchRole("jwt")).resolves.toBeUndefined();
  });
});
