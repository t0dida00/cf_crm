import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn() } }));

import { ImageDropzone } from "./image-dropzone";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  toastError.mockReset();
});

const pick = (container: HTMLElement, file: File) =>
  fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [file] } });

describe("ImageDropzone", () => {
  test("uploads the file and reports its URL", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ url: "https://cdn.example.com/a.png" }), { status: 200 }));
    const onChange = vi.fn();
    const { container } = render(<ImageDropzone value="" onChange={onChange} />);

    pick(container, new File(["png"], "a.png", { type: "image/png" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith("https://cdn.example.com/a.png"));
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/upload");
    expect(init?.headers).toMatchObject({ "Content-Type": "image/png", "X-Filename": "a.png" });
  });

  test("refuses images over 5MB without sending them", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { container } = render(<ImageDropzone value="" onChange={vi.fn()} />);
    const big = new File(["x"], "big.png", { type: "image/png" });
    Object.defineProperty(big, "size", { value: 6 * 1024 * 1024 });

    pick(container, big);

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Image must be smaller than 5MB."));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("with onFile, hands the file over instead of uploading it", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const onFile = vi.fn();
    const { container } = render(<ImageDropzone value="" onChange={vi.fn()} onFile={onFile} />);
    const file = new File(["png"], "logo.png", { type: "image/png" });

    pick(container, file);

    expect(onFile).toHaveBeenCalledWith(file);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  test("shows the server's error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Couldn't save the image: that bucket doesn't exist." }), { status: 502 }),
    );
    const { container } = render(<ImageDropzone value="" onChange={vi.fn()} />);

    pick(container, new File(["png"], "a.png", { type: "image/png" }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Couldn't save the image: that bucket doesn't exist."));
  });
});
