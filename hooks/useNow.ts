"use client";

import { useEffect, useState } from "react";

/**
 * The current time, updated every `intervalMs`. Use it in the component that
 * shows the time, so only that component re-renders on each tick (not the
 * whole shell and its panel).
 */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(i);
  }, [intervalMs]);
  return now;
}
