import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { printReceipt, receiptDocument, savedPaperWidth, savePaperWidth } from "./print-receipt";

beforeEach(() => localStorage.clear());
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("receiptDocument", () => {
  test("sizes the page to the paper and the receipt's length, with no margins", () => {
    const html = receiptDocument("<p>hi</p>", 80, 120.2);
    expect(html).toContain("@page { size: 80mm 121mm; margin: 0; }");
    expect(html).toContain("<body><p>hi</p></body>");
  });

  test("keeps the text inside the printable width (72 mm on 80 mm paper, 48 mm on 58 mm)", () => {
    expect(receiptDocument("", 80)).toContain("padding: 3mm 4mm");
    expect(receiptDocument("", 58)).toContain("padding: 3mm 5mm");
  });

  test("without a measured length, uses a long strip of the right width", () => {
    expect(receiptDocument("", 58)).toContain("@page { size: 58mm 297mm; margin: 0; }");
  });

  test("prints in black only, with amounts that never wrap", () => {
    const html = receiptDocument("", 80);
    expect(html).not.toMatch(/color: #(?!000|fff)/);
    expect(html).toContain("white-space: nowrap");
  });
});

describe("paper width", () => {
  test("defaults to 80 mm and remembers the choice", () => {
    expect(savedPaperWidth()).toBe(80);
    savePaperWidth(58);
    expect(savedPaperWidth()).toBe(58);
  });
});

describe("printReceipt", () => {
  /** Captures the print frame as it's added, and stubs its print(). */
  const captureFrame = () => {
    const print = vi.fn();
    const frames: HTMLIFrameElement[] = [];
    const append = document.body.appendChild.bind(document.body);
    vi.spyOn(document.body, "appendChild").mockImplementation(<T extends Node>(node: T) => {
      const added = append(node);
      if (node instanceof HTMLIFrameElement) {
        frames.push(node);
        node.contentWindow!.print = print;
      }
      return added;
    });
    return { print, frames };
  };

  test("prints only the receipt, in its own frame at the paper's width, then removes the frame", () => {
    vi.useFakeTimers();
    const { print, frames } = captureFrame();
    const source = document.createElement("div");
    source.innerHTML = '<p class="bill-name">Khoa Restaurant</p>';

    printReceipt(source, 58);

    expect(print).toHaveBeenCalledTimes(1);
    const frame = frames[0];
    expect(frame.style.width).toBe("58mm");
    const doc = frame.contentDocument!;
    expect(doc.body.innerHTML).toBe('<p class="bill-name">Khoa Restaurant</p>');
    expect(doc.head.innerHTML).toContain("size: 58mm");

    frame.contentWindow!.dispatchEvent(new Event("afterprint"));
    expect(document.body.contains(frame)).toBe(false);
  });

  test("removes the frame even if afterprint never comes", () => {
    vi.useFakeTimers();
    const { frames } = captureFrame();
    printReceipt(document.createElement("div"), 80);
    expect(document.body.contains(frames[0])).toBe(true);
    vi.advanceTimersByTime(60_000);
    expect(document.body.contains(frames[0])).toBe(false);
  });
});
