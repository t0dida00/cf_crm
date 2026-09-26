import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fetchJson, isAbortError } from "./http";

/** A fetch that never answers on its own, but rejects when its signal aborts. */
const hangingFetch = vi.fn((_url: string, init?: RequestInit) => {
  return new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  });
});

describe("fetchJson", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    hangingFetch.mockClear();
  });

  test("returns parsed JSON and sends JSON headers", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: 1 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchJson("/x", { headers: { "X-Test": "1" } })).resolves.toEqual({ ok: 1 });
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1];
    expect(init.headers).toEqual({ "Content-Type": "application/json", "X-Test": "1" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  test("throws the backend's error message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ error: "Nope" }), { status: 400 })));
    await expect(fetchJson("/x")).rejects.toThrow("Nope");
  });

  test("returns undefined for 204", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    await expect(fetchJson("/x")).resolves.toBeUndefined();
  });

  test("aborts when the caller's signal aborts", async () => {
    vi.stubGlobal("fetch", hangingFetch);
    const controller = new AbortController();
    const request = fetchJson("/x", { signal: controller.signal });
    controller.abort();
    const err = await request.catch((e) => e);
    expect(isAbortError(err)).toBe(true);
  });

  test("an already-aborted signal aborts immediately", async () => {
    vi.stubGlobal("fetch", hangingFetch);
    const controller = new AbortController();
    controller.abort();
    const err = await fetchJson("/x", { signal: controller.signal }).catch((e) => e);
    expect(isAbortError(err)).toBe(true);
  });

  test("times out with a readable error", async () => {
    vi.stubGlobal("fetch", hangingFetch);
    const request = fetchJson("/x", { timeoutMs: 1000 });
    vi.advanceTimersByTime(1000);
    await expect(request).rejects.toThrow("Request timed out");
  });

  test("timeoutMs 0 disables the timeout", async () => {
    vi.stubGlobal("fetch", hangingFetch);
    const controller = new AbortController();
    const request = fetchJson("/x", { timeoutMs: 0, signal: controller.signal });
    vi.advanceTimersByTime(60_000);
    controller.abort();
    expect(isAbortError(await request.catch((e) => e))).toBe(true);
  });
});

describe("isAbortError", () => {
  test("recognises abort errors only", () => {
    expect(isAbortError(new DOMException("x", "AbortError"))).toBe(true);
    expect(isAbortError(Object.assign(new Error("x"), { name: "AbortError" }))).toBe(true);
    expect(isAbortError(new Error("x"))).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });
});
