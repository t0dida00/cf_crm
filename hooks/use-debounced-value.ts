"use client";

import { useEffect, useState } from "react";

/** Returns `value` once it has stopped changing for `delayMs` — for search
 * inputs, so filtering large lists doesn't rerun on every keystroke. Clearing
 * to an empty string applies immediately. */
export function useDebouncedValue<T>(value: T, delayMs = 500): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (value === "") {
      setDebounced(value);
      return;
    }
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
