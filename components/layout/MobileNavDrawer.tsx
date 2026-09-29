"use client";

import { useTranslation } from "react-i18next";
import { useRef, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

/** The sidebar as a slide-over on narrow screens. A Radix dialog, so it traps
 * focus, closes on Escape or an outside click, hides the page behind it from
 * assistive tech, and returns focus to the menu button when it closes. */
export function MobileNavDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  // The drawer is opened by the shell's own button, not a Radix Trigger, so
  // Radix can't know where to send focus back: remember it ourselves.
  const returnFocusTo = useRef<HTMLElement | null>(null);
  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            // Runs before focus moves into the drawer.
            returnFocusTo.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(e) => {
            if (returnFocusTo.current?.isConnected) {
              e.preventDefault();
              returnFocusTo.current.focus();
            }
          }}
          className="fixed inset-y-0 left-0 z-50 flex w-58 flex-col gap-7 bg-ink p-3.5 text-white outline-none"
        >
          <DialogPrimitive.Title className="sr-only">{t("shell.navigation")}</DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** First focusable element on the page: lets keyboard users jump past the
 * sidebar straight to the panel. Visible only while focused. */
export function SkipToContent({ targetId = "main-content" }: { targetId?: string }) {
  const { t } = useTranslation();
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-brand-700"
    >
      {t("shell.skip")}
    </a>
  );
}
