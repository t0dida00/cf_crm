import { afterEach, describe, expect, test, vi } from "vitest";
import { downloadFile } from "./downloadFile";

afterEach(() => vi.restoreAllMocks());

/** Runs downloadFile and returns the saved file's text and name. */
async function saved(content: string, type?: string) {
  let blob: Blob | undefined;
  URL.createObjectURL = vi.fn((b: Blob) => ((blob = b), "blob:x"));
  URL.revokeObjectURL = vi.fn();
  let name = "";
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
    name = this.download;
  });
  downloadFile(content, "menu.csv", type);
  return { text: new TextDecoder("utf-8", { ignoreBOM: true }).decode(await blob!.arrayBuffer()), name };
}

describe("downloadFile", () => {
  test("a CSV starts with the UTF-8 byte-order mark, so Excel keeps Vietnamese accents", async () => {
    const { text, name } = await saved("name\nPhở bò\n");
    expect(name).toBe("menu.csv");
    expect(text).toBe("﻿name\nPhở bò\n");
  });

  test("never adds the mark twice, and leaves other file types alone", async () => {
    expect((await saved("﻿a,b\n")).text).toBe("﻿a,b\n");
    expect((await saved("<svg/>", "image/svg+xml")).text).toBe("<svg/>");
  });
});
