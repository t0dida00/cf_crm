import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { axeViolations } from "@/test/axe";
import { BrochurePager } from "./BrochurePager";

afterEach(cleanup);

const PAGES = ["Contents", "Starters", "Mains"].map((title) => ({ id: title, title, content: <p>{title} page</p> }));

/** jsdom has no layout: give the scroller a width and a working scrollTo. */
function layOut(scroller: HTMLElement, width = 400) {
  Object.defineProperty(scroller, "clientWidth", { configurable: true, value: width });
  scroller.scrollTo = vi.fn(({ left }: ScrollToOptions) => {
    scroller.scrollLeft = left ?? 0;
  }) as never;
}

describe("BrochurePager", () => {
  test("names each page and makes only the current one usable", () => {
    render(<BrochurePager label="Menu" pages={PAGES} index={1} onIndexChange={vi.fn()} />);
    const pages = screen.getAllByRole("region");
    expect(pages.map((p) => p.getAttribute("aria-label"))).toEqual([
      "Page 1 of 3: Contents",
      "Page 2 of 3: Starters",
      "Page 3 of 3: Mains",
    ]);
    expect(pages.map((p) => p.hasAttribute("inert"))).toEqual([true, false, true]);
  });

  test("a swipe reports the page it lands on", () => {
    const onIndexChange = vi.fn();
    render(<BrochurePager label="Menu" pages={PAGES} index={0} onIndexChange={onIndexChange} />);
    const scroller = screen.getByLabelText("Menu");
    layOut(scroller);
    scroller.scrollLeft = 800;
    fireEvent.scroll(scroller);
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  test("turning to a page scrolls there, and pages passed on the way aren't reported", () => {
    const onIndexChange = vi.fn();
    const { rerender } = render(<BrochurePager label="Menu" pages={PAGES} index={0} onIndexChange={onIndexChange} />);
    const scroller = screen.getByLabelText("Menu");
    const scrollTo = vi.fn();
    Object.defineProperty(scroller, "clientWidth", { configurable: true, value: 400 });
    scroller.scrollTo = scrollTo as never;

    rerender(<BrochurePager label="Menu" pages={PAGES} index={2} onIndexChange={onIndexChange} />);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ left: 800 }));

    // Mid-way through the smooth scroll: page 2 isn't "current".
    scroller.scrollLeft = 400;
    fireEvent.scroll(scroller);
    expect(onIndexChange).not.toHaveBeenCalled();
    // Arrived: later swipes are reported again.
    scroller.scrollLeft = 800;
    fireEvent.scroll(scroller);
    scroller.scrollLeft = 0;
    fireEvent.scroll(scroller);
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  test("has no axe violations", async () => {
    const { container } = render(<BrochurePager label="Menu" pages={PAGES} index={0} onIndexChange={vi.fn()} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
