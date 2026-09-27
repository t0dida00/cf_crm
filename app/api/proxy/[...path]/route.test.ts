import { NextRequest } from "next/server";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: async () => ({ accessToken: "jwt-1" }) }));

vi.mock("@/lib/server-token", () => ({ getAccessToken: async () => "jwt-1" }));

import * as route from "./route";

afterEach(() => vi.restoreAllMocks());

const params = (path: string[]) => ({ params: Promise.resolve({ path }) });

describe("staff API proxy", () => {
  // Every method a backend route uses must be exported, or Next answers 405.
  test.each(["GET", "POST", "PUT", "PATCH", "DELETE"] as const)("handles %s", (method) => {
    expect(typeof route[method]).toBe("function");
  });

  test("forwards a PUT with its body and the session's token", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const req = new NextRequest("http://localhost:3001/api/proxy/platforms/me/connections/database", {
      method: "PUT",
      body: JSON.stringify({ url: "postgresql://u:p@h/db" }),
    });

    const res = await route.PUT(req, params(["platforms", "me", "connections", "database"]));

    expect(res.status).toBe(200);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toMatch(/\/platforms\/me\/connections\/database$/);
    expect(init?.method).toBe("PUT");
    expect(init?.body).toBe(JSON.stringify({ url: "postgresql://u:p@h/db" }));
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer jwt-1");
  });
});
