import { beforeEach, describe, expect, test, vi } from "vitest";

const getToken = vi.hoisted(() => vi.fn());
vi.mock("next-auth/jwt", () => ({ getToken }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ cookie: "x=1" }) }));

import { getAccessToken } from "./server-token";

beforeEach(() => getToken.mockReset());

describe("getAccessToken", () => {
  test("reads the JWT from the secure cookie (HTTPS)", async () => {
    getToken.mockImplementation(async (opts?: { secureCookie?: boolean }) => (opts?.secureCookie ? { accessToken: "jwt-secure" } : null));
    await expect(getAccessToken()).resolves.toBe("jwt-secure");
  });

  test("falls back to the plain cookie (localhost)", async () => {
    getToken.mockImplementation(async (opts?: { secureCookie?: boolean }) => (opts?.secureCookie ? null : { accessToken: "jwt-local" }));
    await expect(getAccessToken()).resolves.toBe("jwt-local");
  });

  test("is null when signed out", async () => {
    getToken.mockResolvedValue(null);
    await expect(getAccessToken()).resolves.toBeNull();
  });
});
