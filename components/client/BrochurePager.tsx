"use client";

import { useEffect, useRef, type ReactNode } from "react";

export interface BrochurePage {
  id: string;
  /** Names the page for screen readers: "Page 2 of 5: Starters". */
  title: string;
  content: ReactNode;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * Pages side by side that snap into place: swipe (or scroll) left and right to
 * turn them, like a folded brochure. `index` is the page on screen; set it to
 * turn to a page (pills, arrows), and `onIndexChange` reports pages turned by
 * swiping. Pages off screen are inert, so keyboard focus stays on the one you
 * can see. Each page scrolls on its own when it's taller than the screen.
 */
export function BrochurePager({
  pages,
  index,
  onIndexChange,
  label,
}: {
  pages: BrochurePage[];
  index: number;
  onIndexChange: (index: number) => void;
  label: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  // The page a programmatic turn is heading to: pages passed on the way aren't "current".
  const heading = useRef<number | null>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el || !el.clientWidth) return;
    const left = index * el.clientWidth;
    if (Math.abs(el.scrollLeft - left) < 2) return;
    heading.current = index;
    el.scrollTo({ left, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [index]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el || !el.clientWidth) return;
    const at = Math.round(el.scrollLeft / el.clientWidth);
    if (heading.current !== null) {
      if (at === heading.current) heading.current = null;
      return;
    }
    if (at !== index && at >= 0 && at < pages.length) onIndexChange(at);
  };

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      aria-label={label}
      className="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {pages.map((page, i) => (
        <section
          key={page.id}
          aria-roledescription="page"
          aria-label={`Page ${i + 1} of ${pages.length}: ${page.title}`}
          inert={i !== index}
          className="h-full w-full shrink-0 snap-start snap-always overflow-y-auto overscroll-y-contain"
        >
          {page.content}
        </section>
      ))}
    </div>
  );
}
