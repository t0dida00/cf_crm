import { NextRequest } from "next/server";
import { afterEach, describe, expect, test, vi } from "vitest";

const session = vi.hoisted(() => ({ value: { accessToken: "jwt-1" } as object | null }));
vi.mock("@/auth", () => ({ auth: async () => session.value }));

vi.mock("@/lib/server-token", () => ({ getAccessToken: async () => "jwt-1" }));

import { POST } from "./route";

afterEach(() => {
  vi.restoreAllMocks();
  session.value = { accessToken: "jwt-1" };
});

const upload = () =>
  new NextRequest("http://localhost:3001/api/upload", {
    method: "POST",
    headers: { "Content-Type": "image/png", "X-Filename": "latte.png" },
    body: new Uint8Array([137, 80, 78, 71]),
  });

describe("image upload route", () => {
  test("forwards the raw image, its type and name to the backend with the session's token", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ url: "https://cdn.example.com/dishes/1-latte.png" }), { status: 200 }));

    const res = await POST(upload());

    expect(await res.json()).toEqual({ url: "https://cdn.example.com/dishes/1-latte.png" });
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toMatch(/\/platforms\/me\/uploads$/);
    expect(new Uint8Array(init?.body as ArrayBuffer)).toEqual(new Uint8Array([137, 80, 78, 71]));
    expect(init?.headers).toMatchObject({ "Content-Type": "image/png", "X-Filename": "latte.png", Authorization: "Bearer jwt-1" });
  });

  test("passes the backend's error through", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ error: "Nope" }), { status: 409 }));
    const res = await POST(upload());
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "Nope" });
  });

  test("refuses signed-out requests", async () => {
    session.value = null;
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect((await POST(upload())).status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
