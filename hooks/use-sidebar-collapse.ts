"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "crm-sidebar-collapsed";
const NARROW_QUERY = "(max-width: 767px)";

/**
 * Persists the sidebar's collapsed state per-browser (not shared data, so
 * localStorage rather than the backend) across admin/staff sessions.
 *
 * Below the md breakpoint the sidebar is always collapsed to its icon rail
 * in normal document flow — a w-58 sidebar has no room to coexist with a
 * usable header/content area on a phone-width screen — but the toggle still
 * works there: it opens the full sidebar as a fixed-position overlay drawer
 * (`mobileOpen`) instead of expanding in place, since expanding in place is
 * exactly the squeeze that breaks the layout on mobile.
 */
export function useSidebarCollapse() {
  const [storedCollapsed, setStoredCollapsed] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setStoredCollapsed(window.localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      // localStorage unavailable (e.g. private browsing) — stay expanded.
    }

    const mql = window.matchMedia(NARROW_QUERY);
    setIsNarrow(mql.matches);
    const onChange = (e: MediaQueryListEvent) => {
      setIsNarrow(e.matches);
      setMobileOpen(false);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Body scroll is locked while the mobile drawer covers the screen, so the
  // page behind it can't scroll along with the drawer's own content.
  useEffect(() => {
    if (!isNarrow) return;
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isNarrow, mobileOpen]);

  const toggle = () => {
    if (isNarrow) {
      setMobileOpen((prev) => !prev);
      return;
    }
    setStoredCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Non-critical — the toggle still works for this session.
      }
      return next;
    });
  };

  const closeMobile = () => setMobileOpen(false);

  return {
    collapsed: isNarrow ? true : storedCollapsed,
    isNarrow,
    mobileOpen,
    closeMobile,
    toggle,
  };
}
