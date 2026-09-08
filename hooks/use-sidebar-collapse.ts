"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "crm-sidebar-collapsed";

/** Persists the sidebar's collapsed state per-browser (not shared data, so
 * localStorage rather than the backend) across admin/staff sessions. */
export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      // localStorage unavailable (e.g. private browsing) — stay expanded.
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Non-critical — the toggle still works for this session.
      }
      return next;
    });
  };

  return { collapsed, toggle };
}
