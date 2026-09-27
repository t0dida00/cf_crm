import { afterEach, describe, expect, test, vi } from "vitest";
import { uploadImage } from "./upload-image";

afterEach(() => vi.restoreAllMocks());

const png = () => new File(["png"], "latte.png", { type: "image/png" });

describe("uploadImage", () => {
  test("posts the file with its type and name and returns the URL", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ url: "https://cdn.example.com/latte.png" }), { status: 200 }));
    await expect(uploadImage(png())).resolves.toBe("https://cdn.example.com/latte.png");
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/upload");
    expect(init?.headers).toEqual({ "Content-Type": "image/png", "X-Filename": "latte.png" });
  });

  test("refuses files over 4MB without sending them", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const big = png();
    Object.defineProperty(big, "size", { value: 4 * 1024 * 1024 + 1 });
    await expect(uploadImage(big)).rejects.toThrow("Image must be smaller than 4MB.");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("throws the server's error, or a fallback", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({ error: "Nope" }), { status: 409 }));
    await expect(uploadImage(png())).rejects.toThrow("Nope");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("oops", { status: 500 }));
    await expect(uploadImage(png())).rejects.toThrow("Failed to upload image.");
  });
});
