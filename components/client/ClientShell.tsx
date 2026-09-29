"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BowlFood,
  CaretLeft,
  CaretRight,
  Cake,
  CheckCircle,
  ClockCounterClockwise,
  ForkKnife,
  HandWaving,
  MapPin,
  Minus,
  NotePencil,
  Phone,
  Plus,
  QrCode,
  Receipt,
  Trash,
  Wine,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { TONE_CLASSES } from "@/lib/tone";
import type { Category, Dish, Order, OrderLine, TableRec, TableRequestType } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { DishImage } from "@/components/common/DishImage";
import { BrochurePager } from "./BrochurePager";

/** Each screen's heading: it takes focus when the screen changes, and is the fallback focus target. */
const SCREEN_HEADING_ID = "client-screen-heading";

const CATEGORY_ICONS: Record<string, PhosphorIcon> = {
  Starters: BowlFood,
  Mains: ForkKnife,
  Desserts: Cake,
  Drinks: Wine,
  Coffee: Wine,
  Bakery: Cake,
  Brunch: BowlFood,
};

interface PlacedOrder {
  code: string;
  lines: OrderLine[];
  total: number;
}

export interface ClientShellProps {
  tableName: string;
  workspaceName: string;
  workspaceAddress?: string | null;
  workspacePhone?: string | null;
  workspaceLogoUrl?: string | null;
  categories: Category[];
  dishes: Dish[];
  taxRate: number;
  fmt: (value: number) => string;
  orders: Order[];
  /** null for a guest session — ordering isn't available without a staff-logged-in browser yet. */
  placeOrder:
    | ((tableName: string, lines: { itemId: string; qty: number; note?: string }[]) => Promise<Order>)
    | null;
  createTableRequest: (input: { tableName: string; type: TableRequestType }) => Promise<void>;
}

export function ClientShell({
  tableName,
  workspaceName,
  workspaceAddress,
  workspacePhone,
  workspaceLogoUrl,
  categories,
  dishes,
  taxRate,
  fmt,
  orders,
  placeOrder,
  createTableRequest,
}: ClientShellProps) {
  const validCategories = useMemo(
    () => categories.filter((c) => c.valid && dishes.some((d) => d.catId === c.id)),
    [categories, dishes],
  );

  // The brochure's page on screen: 0 is the cover, then one page per category.
  const [page, setPage] = useState(0);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteOpenId, setNoteOpenId] = useState<string | null>(null);
  const [screen, setScreen] = useState<"menu" | "review" | "done">("menu");
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [activeAction, setActiveAction] = useState<"staff" | "checkout" | null>(null);
  const [notice, setNotice] = useState<{ title: string; description: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  // Keyboard focus to restore after a render that replaces the focused control
  // (Add ↔ counter, removed lines, screen changes): an element id.
  const focusNext = useRef<string | null>(null);
  useEffect(() => {
    if (!focusNext.current) return;
    const el = document.getElementById(focusNext.current) ?? document.getElementById(SCREEN_HEADING_ID);
    focusNext.current = null;
    el?.focus();
  });
  // A new screen takes focus to its heading, so it's announced (not on first load).
  const firstScreen = useRef(true);
  useEffect(() => {
    if (firstScreen.current) {
      firstScreen.current = false;
      return;
    }
    document.getElementById(SCREEN_HEADING_ID)?.focus();
  }, [screen]);

  const canOrder = placeOrder !== null;

  const tableOrders = useMemo(
    () => orders.filter((o) => o.tableName === tableName).sort((a, b) => b.ts - a.ts),
    [orders, tableName],
  );
  const tableOrdersTotal = useMemo(
    () => tableOrders.reduce((sum, o) => sum + o.total, 0),
    [tableOrders],
  );

  const notify = (action: "staff" | "checkout", title: string, description: string) => {
    setActiveAction(action);
    setNotice({ title, description });
    createTableRequest({
      tableName,
      type: action === "staff" ? "call_staff" : "checkout",
    }).catch(() => {
      // A missed ping is recoverable — the guest can just tap again. Don't
      // break the local confirmation UI over a transient network hiccup.
    });
  };

  const closeNotice = () => {
    setNotice(null);
    setActiveAction(null);
  };

  // A category's dishes: available ones first, then by name.
  const itemsFor = (catId: string) =>
    dishes
      .filter((d) => d.catId === catId)
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "valid" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
  const pageCount = validCategories.length + 1;

  const setQty = (itemId: string, qty: number) =>
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[itemId];
      else next[itemId] = qty;
      return next;
    });

  const cartLines = Object.entries(cart).map(([itemId, qty]) => {
    const dish = dishes.find((d) => d.id === itemId)!;
    return { itemId, qty, price: dish.price, name: dish.name, note: notes[itemId] };
  });
  const cartCount = cartLines.reduce((a, l) => a + l.qty, 0);
  const cartTotal = cartLines.reduce((a, l) => a + l.qty * l.price, 0);

  const handleConfirmOrder = async () => {
    if (!cartCount || !placeOrder || submitting) return;
    const lines = cartLines.map(({ itemId, qty, note }) => ({ itemId, qty, note }));
    setSubmitting(true);
    setOrderError(null);
    try {
      const order = await placeOrder(tableName, lines);
      // The backend is the source of truth for the order code — it's the
      // same code staff see in their Orders panel — not something to guess
      // client-side (a prior version fabricated one from local order count,
      // which never matched what staff actually saw).
      setPlaced({ code: order.code, lines: order.lines, total: order.total });
      setCart({});
      setNotes({});
      setNoteOpenId(null);
      setScreen("done");
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const net = placed ? placed.total / (1 + taxRate / 100) : 0;
  const tax = placed ? placed.total - net : 0;

  // One printed-menu entry: name, a dotted leader to the price, then tags,
  // description, the kitchen note, and Add.
  const dishEntry = (dish: Dish, Icon: PhosphorIcon, eager: boolean) => {
    const qty = cart[dish.id] ?? 0;
    const noteOpen = noteOpenId === dish.id;
    const noteText = notes[dish.id] ?? "";
    const soldOut = dish.status === "sold_out";
    return (
      <li key={dish.id} className="flex gap-3.5 border-t border-dashed py-4 first:border-t-0 first:pt-1">
        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary text-muted-foreground sm:size-20">
          {dish.imageUrl ? (
            <DishImage
              src={dish.imageUrl}
              alt="" // the name is shown right beside it
              sizes="(min-width: 640px) 80px, 64px"
              priority={eager}
              fallback={<Icon size={26} weight="fill" />}
            />
          ) : (
            <Icon size={26} weight="fill" aria-hidden />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-baseline gap-2">
            <h3 className={cn("min-w-0 text-base leading-snug font-bold", soldOut && "text-muted-foreground")}>
              {dish.name}
            </h3>
            {/* The dotted leader of a printed menu, from the name to the price. */}
            <span aria-hidden className="mb-1 min-w-4 flex-1 border-b-2 border-dotted border-muted-foreground/40" />
            <span className="shrink-0 font-bold tabular-nums">{fmt(dish.price)}</span>
          </div>
          {/* Sold out shows where Add would be, so it isn't repeated as a tag. */}
          {(dish.isVegan || dish.isBestSeller) && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {dish.isVegan && <Badge className={TONE_CLASSES.green}>Vegan</Badge>}
              {dish.isBestSeller && <Badge className={TONE_CLASSES.brand}>Best seller</Badge>}
            </div>
          )}
          {dish.description && (
            <p className="mt-1 text-[13px] leading-relaxed text-pretty text-muted-foreground">{dish.description}</p>
          )}
          {noteOpen ? (
            <div className="mt-2">
              <textarea
                aria-label={`Note for the kitchen: ${dish.name}`}
                value={noteText}
                onChange={(e) => setNotes((n) => ({ ...n, [dish.id]: e.target.value }))}
                placeholder="Add a note for the kitchen, e.g. no onion"
                rows={2}
                className="w-full resize-none rounded-lg border border-input-border bg-background p-2 text-base outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="mt-1.5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setNotes((n) => {
                      const next = { ...n };
                      delete next[dish.id];
                      return next;
                    });
                    setNoteOpenId(null);
                  }}
                  className="text-[13px] font-semibold text-muted-foreground"
                >
                  Clear
                </button>
                <button type="button" onClick={() => setNoteOpenId(null)} className="text-[13px] font-bold text-brand-700">
                  Done
                </button>
              </div>
            </div>
          ) : (
            noteText && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md bg-brand-50 px-2.5 py-1.5 text-xs text-brand-700">
                <NotePencil size={13} weight="bold" className="mt-px shrink-0" aria-hidden />
                {noteText}
              </div>
            )
          )}
          <div className="mt-2.5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setNoteOpenId(noteOpen ? null : dish.id)}
              aria-label={noteText ? `Edit note for ${dish.name}` : `Add a note for ${dish.name}`}
              aria-expanded={noteOpen}
              className={cn(
                "flex size-[34px] items-center justify-center rounded-full border",
                noteOpen || noteText ? "border-brand-500 bg-brand-50 text-brand-700" : "border-border text-muted-foreground",
              )}
            >
              <NotePencil size={15} weight="bold" aria-hidden />
            </button>
            {qty > 0 && (
              <button
                type="button"
                onClick={() => {
                  focusNext.current = `add-${dish.id}`;
                  setQty(dish.id, 0);
                }}
                aria-label={`Remove ${dish.name}`}
                className="flex size-[34px] items-center justify-center rounded-full border border-border text-muted-foreground hover:text-destructive"
              >
                <Trash size={15} weight="bold" aria-hidden />
              </button>
            )}
            {soldOut ? (
              <span className="flex h-[34px] items-center rounded-full bg-secondary px-3.5 text-[13px] font-bold text-muted-foreground">
                Sold out
              </span>
            ) : qty === 0 ? (
              <button
                id={`add-${dish.id}`}
                type="button"
                onClick={() => {
                  focusNext.current = `inc-${dish.id}`;
                  setQty(dish.id, 1);
                }}
                aria-label={`Add ${dish.name}`}
                className="flex h-[34px] items-center gap-1.5 rounded-full bg-brand-700 px-3.5 text-[13px] font-bold text-white"
              >
                <Plus size={13} weight="bold" aria-hidden />
                Add
              </button>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-brand-50 p-[3px]">
                <button
                  type="button"
                  onClick={() => {
                    if (qty === 1) focusNext.current = `add-${dish.id}`;
                    setQty(dish.id, qty - 1);
                  }}
                  aria-label={`Remove one ${dish.name}`}
                  className="flex size-7 items-center justify-center rounded-full border bg-background text-brand-700"
                >
                  <Minus size={13} weight="bold" aria-hidden />
                </button>
                <span aria-live="polite" className="min-w-5 text-center text-sm font-bold text-brand-700">
                  {qty}
                  <span className="sr-only"> × {dish.name}</span>
                </span>
                <button
                  id={`inc-${dish.id}`}
                  type="button"
                  onClick={() => setQty(dish.id, qty + 1)}
                  aria-label={`Add one ${dish.name}`}
                  className="flex size-7 items-center justify-center rounded-full bg-brand-700 text-white"
                >
                  <Plus size={13} weight="bold" aria-hidden />
                </button>
              </span>
            )}
          </div>
        </div>
      </li>
    );
  };

  /** A sheet of the brochure: white paper on the grey desk, the folio at the foot. */
  const sheet = (number: number, children: ReactNode) => (
    <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col p-3 sm:p-5">
      <div className="flex flex-1 flex-col rounded-2xl border bg-card px-5 pt-6 pb-4 shadow-[0_8px_20px_-14px_rgb(35_47_63/0.35)] sm:px-8">
        {children}
        <p aria-hidden className="mt-auto pt-6 text-right text-xs font-semibold text-muted-foreground tabular-nums">
          {number} / {pageCount}
        </p>
      </div>
    </div>
  );

  /** Page 1: the brochure's cover and its contents. */
  const coverPage = () =>
    sheet(
      1,
      <>
        <div className="flex flex-col items-center text-center">
          <span className="flex size-20 items-center justify-center overflow-hidden rounded-2xl bg-brand-500 text-white">
            {workspaceLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={workspaceLogoUrl} alt="" className="size-full object-cover" />
            ) : (
              <ForkKnife size={40} weight="bold" aria-hidden />
            )}
          </span>
          <h2 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight text-balance">{workspaceName}</h2>
          {workspaceAddress && <p className="mt-1.5 text-sm text-muted-foreground">{workspaceAddress}</p>}
          {workspacePhone && <p className="text-sm text-muted-foreground">{workspacePhone}</p>}
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[13px] font-bold text-brand-700">
            <QrCode size={14} weight="bold" aria-hidden />
            {tableName}
          </p>
        </div>

        <h3 className="mt-8 text-sm font-bold">In this menu</h3>
        <ol className="mt-2">
          {validCategories.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setPage(i + 1)}
                aria-label={`${c.name}, page ${i + 2}`}
                className="flex w-full items-baseline gap-2 py-2.5 text-left"
              >
                <span className="font-semibold">{c.name}</span>
                <span aria-hidden className="mb-1 flex-1 border-b-2 border-dotted border-muted-foreground/40" />
                <span className="text-sm text-muted-foreground tabular-nums">{i + 2}</span>
              </button>
            </li>
          ))}
        </ol>

        {validCategories.length > 0 && (
          <p className="mt-6 flex items-center justify-center gap-2 text-[13px] font-semibold text-muted-foreground">
            Swipe to open the menu
            <ArrowRight size={14} weight="bold" aria-hidden />
          </p>
        )}
      </>,
    );

  /** A category's page: its name as the page heading, then its dishes. */
  const categoryPage = (category: Category, index: number) => {
    const Icon = CATEGORY_ICONS[category.name] ?? ForkKnife;
    return sheet(
      index + 1,
      <>
        <h2 className="text-3xl leading-tight font-extrabold tracking-tight">{category.name}</h2>
        <ul className="mt-4">{itemsFor(category.id).map((dish, i) => dishEntry(dish, Icon, index === 1 && i < 4))}</ul>
      </>,
    );
  };

  if (screen === "done" && placed) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-secondary/30 px-4 py-10 sm:py-16">
        <div className="flex w-full max-w-md flex-1 flex-col items-center justify-center text-center sm:flex-none">
          <div className="flex size-16 items-center rounded-full bg-brand-50 text-brand-700 sm:size-19">
            <CheckCircle size={100} weight="fill" />
          </div>
          <h1 id={SCREEN_HEADING_ID} tabIndex={-1} className="mt-6 text-xl font-bold outline-none sm:text-2xl">
            Thanks for your order
          </h1>
          <p className="mt-2.5 text-[15px] text-muted-foreground">
            We&apos;re preparing your foods.
            <br />
            Enjoy your meals
          </p>

          <div className="mt-7 w-full rounded-xl border bg-card p-4 text-left">
            <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-muted-foreground">
              <span>{placed.code}</span>
              <span>{tableName}</span>
            </div>
            {placed.lines.map((line) => (
              <div
                key={line.itemId}
                className="mt-2.5 flex items-start gap-3 border-t pt-2.5 text-sm"
              >
                <span className="w-6 font-bold text-muted-foreground/70">{line.qty}×</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">
                    {line.name}
                    {line.note ? `, ${line.note}` : ""}
                  </span>
                  {dishes.find((d) => d.id === line.itemId)?.isVegan && (
                    <Badge className={cn(TONE_CLASSES.green, "mt-1")}>Vegan</Badge>
                  )}
                </span>
                <span className="font-semibold">{fmt(line.price * line.qty)}</span>
              </div>
            ))}
            <div className="mt-3 flex justify-between border-t pt-3 text-[13px] text-muted-foreground">
              <span>Net</span>
              <span>{fmt(net)}</span>
            </div>
            <div className="mt-1.5 flex justify-between text-[13px] text-muted-foreground">
              <span>Tax ({taxRate}%)</span>
              <span>{fmt(tax)}</span>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t pt-2.5">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold">{fmt(placed.total)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPlaced(null);
              setScreen("menu");
            }}
            className="mt-5 text-sm font-bold text-brand-700"
          >
            Order something else
          </button>
        </div>
      </div>
    );
  }

  if (screen === "review") {
    return (
      <div className="flex min-h-screen flex-col bg-secondary/20">
        <header className="sticky top-0 z-10 border-b bg-card px-4 py-3 sm:px-6">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
            <button
              type="button"
              onClick={() => setScreen("menu")}
              aria-label="Back to menu"
              className="flex size-8 shrink-0 items-center justify-center rounded-full border text-muted-foreground"
            >
              <ArrowLeft size={16} weight="bold" />
            </button>
            <h1 id={SCREEN_HEADING_ID} tabIndex={-1} className="text-[17px] font-bold outline-none">
              Your order
            </h1>
            <span className="flex-1" />
            <span className="text-[13px] font-semibold text-muted-foreground">{tableName}</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-2xl flex-1 space-y-3 p-4 pb-40 sm:p-6">
          {cartLines.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Your cart is empty.
            </p>
          ) : (
            cartLines.map((line, i) => {
              const dish = dishes.find((d) => d.id === line.itemId);
              const category = categories.find((c) => c.id === dish?.catId);
              const Icon = CATEGORY_ICONS[category?.name ?? ""] ?? ForkKnife;
              return (
                <div key={line.itemId} className="flex gap-3 rounded-xl border bg-card p-3">
                  <div aria-hidden="true" className="hidden w-6 shrink-0 pt-0.5 text-[13px] font-bold text-muted-foreground sm:block">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border bg-secondary/50 text-muted-foreground sm:size-[100px]">
                    <Icon size={28} weight="fill" className="sm:size-[30px]" />
                  </div>
                  <div className="flex min-w-0 flex-1 items-stretch justify-between gap-2">
                    <div className="flex min-w-0 flex-col ">
                      <div>
                        <span className="text-[15px] font-semibold">{line.name}</span>
                        {dish?.isVegan && (
                          <div className="mt-1">
                            <Badge className={TONE_CLASSES.green}>Vegan</Badge>
                          </div>
                        )}
                        {line.note && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-brand-700">
                            <NotePencil size={12} weight="bold" />
                            {line.note}
                          </div>
                        )}
                      </div>
                      <span className="text-[13px] text-muted-foreground">
                        {fmt(dish?.price ?? line.price)} each
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          focusNext.current = SCREEN_HEADING_ID; // the line is gone
                          setQty(line.itemId, 0);
                        }}
                        aria-label={`Remove ${line.name}`}
                        className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                      <span className="font-semibold">{fmt(line.price * line.qty)}</span>
                      <span className="flex items-center gap-1 rounded-full bg-brand-50 p-[3px]">
                        <button
                          type="button"
                          onClick={() => {
                            if (line.qty === 1) focusNext.current = SCREEN_HEADING_ID;
                            setQty(line.itemId, line.qty - 1);
                          }}
                          aria-label={`Remove one ${line.name}`}
                          className="flex size-7 items-center justify-center rounded-full border bg-background text-brand-700"
                        >
                          <Minus size={13} weight="bold" />
                        </button>
                        <span aria-live="polite" className="min-w-5 text-center text-sm font-bold text-brand-700">
                          {line.qty}
                          <span className="sr-only"> × {line.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(line.itemId, line.qty + 1)}
                          aria-label={`Add one ${line.name}`}
                          className="flex size-7 items-center justify-center rounded-full bg-brand-700 text-white"
                        >
                          <Plus size={13} weight="bold" />
                        </button>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </main>

        <footer className="fixed inset-x-0 bottom-0 border-t bg-card px-4 pt-3 pb-3 sm:px-6">
          <div className="mx-auto w-full max-w-2xl">
            {cartCount > 0 && (
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-bold">{fmt(cartTotal)}</span>
              </div>
            )}
            {!canOrder && cartCount > 0 && (
              <p className="mb-3 text-center text-[13px] text-muted-foreground">
                Ask a staff member to place your order for now.
              </p>
            )}
            {orderError && (
              <p role="alert" className="mb-3 text-center text-[13px] text-destructive">
                {orderError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setScreen("menu")}
                className="h-13 shrink-0 rounded-2xl border px-5 text-base font-bold text-foreground"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={!cartCount || !canOrder || submitting}
                onClick={handleConfirmOrder}
                className={cn(
                  "flex h-13 flex-1 items-center justify-center rounded-2xl px-5 text-base font-bold text-white transition-colors",
                  cartCount && canOrder && !submitting
                    ? "bg-brand-700"
                    : "cursor-not-allowed bg-muted-foreground/30",
                )}
              >
                {submitting ? "Placing order…" : "Confirm order"}
              </button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    // A brochure: the header and the order bar stay put, the pages turn in between.
    <div className="flex h-dvh flex-col bg-secondary">
      <header className="z-10 shrink-0 border-b bg-card px-4 pt-3 pb-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-500 text-white">
            {workspaceLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={workspaceLogoUrl} alt="" className="size-full object-cover" />
            ) : (
              <ForkKnife size={22} weight="bold" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <h1 id={SCREEN_HEADING_ID} tabIndex={-1} className="truncate text-[15px] font-bold tracking-tight outline-none">
              {workspaceName}
            </h1>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-bold text-brand-700">
            <QrCode size={14} weight="bold" />
            {tableName}
          </span>
        </div>

        <div className="mx-auto mt-2.5 flex w-full max-w-2xl gap-2">
          <button
            type="button"
            onClick={() =>
              notify(
                "staff",
                "Staff notified",
                "Someone will be right with you.",
              )
            }
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-semibold transition-colors active:bg-brand-700 active:text-white active:border-brand-700",
              activeAction === "staff"
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-border text-foreground",
            )}
          >
            <HandWaving size={15} weight="bold" />
            Call staff
          </button>
          <button
            type="button"
            onClick={() =>
              notify(
                "checkout",
                "Bill requested",
                "Staff will bring your bill shortly.",
              )
            }
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-semibold transition-colors active:bg-brand-700 active:text-white active:border-brand-700",
              activeAction === "checkout"
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-border text-foreground",
            )}
          >
            <Receipt size={15} weight="bold" />
            Checkout
          </button>
          {canOrder && (
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-label={`Order history${tableOrders.length ? `, ${tableOrders.length} orders` : ""}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-[13px] font-semibold text-foreground"
            >
              <ClockCounterClockwise size={15} weight="bold" aria-hidden />
              History
              {tableOrders.length > 0 && (
                <span className="flex min-w-4.5 items-center justify-center rounded-full bg-secondary px-1 text-[11px] font-bold text-muted-foreground">
                  {tableOrders.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* The brochure's sections: jump to a page; the current one follows the swipe. */}
        <nav aria-label="Menu sections" className="mx-auto mt-3 flex w-full max-w-2xl gap-2 overflow-x-auto">
          {["Contents", ...validCategories.map((c) => c.name)].map((name, i) => (
            <button
              key={name + i}
              type="button"
              onClick={() => setPage(i)}
              aria-current={page === i ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
                page === i
                  ? "border-foreground bg-foreground font-bold text-white"
                  : "border-border bg-background text-muted-foreground",
              )}
            >
              {name}
            </button>
          ))}
        </nav>
      </header>

      <main className="min-h-0 flex-1">
        <BrochurePager
          label="Menu, swipe left or right to turn the page"
          index={page}
          onIndexChange={setPage}
          pages={[
            { id: "cover", title: "Contents", content: coverPage() },
            ...validCategories.map((category, i) => ({
              id: category.id,
              title: category.name,
              content: categoryPage(category, i + 1),
            })),
          ]}
        />
      </main>

      <footer className="shrink-0 border-t bg-card px-4 pt-2 pb-3 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          {/* Turn the page without swiping (keyboard, single tap). */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              aria-label="Previous page"
              className="flex size-9 items-center justify-center rounded-full border text-foreground disabled:opacity-30"
            >
              <CaretLeft size={16} weight="bold" aria-hidden />
            </button>
            <span className="text-[13px] font-semibold text-muted-foreground tabular-nums" aria-live="polite">
              Page {page + 1} of {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={page === pageCount - 1}
              aria-label="Next page"
              className="flex size-9 items-center justify-center rounded-full border text-foreground disabled:opacity-30"
            >
              <CaretRight size={16} weight="bold" aria-hidden />
            </button>
          </div>
          <button
            type="button"
            disabled={!cartCount}
            onClick={() => setScreen("review")}
            className={cn(
              "flex h-13 w-full items-center rounded-2xl px-5 text-base font-bold text-white transition-colors",
              cartCount ? "bg-brand-700" : "cursor-not-allowed bg-muted-foreground/30",
            )}
          >
            <span>
              {cartCount
                ? `${canOrder ? "Order" : "View cart"} · ${cartCount} ${cartCount === 1 ? "item" : "items"}`
                : "Order"}
            </span>
            <span className="flex-1" />
            <span>{cartCount ? fmt(cartTotal) : ""}</span>
          </button>
        </div>
      </footer>

      <Dialog open={!!notice} onOpenChange={(open) => !open && closeNotice()}>
        <DialogContent className="w-[90%] rounded-2xl">
          <DialogHeader>
            <div className="flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand-700">
              {activeAction === "checkout" ? (
                <Receipt size={20} weight="fill" />
              ) : (
                <HandWaving size={20} weight="fill" />
              )}
            </div>
            <DialogTitle>{notice?.title}</DialogTitle>
            <DialogDescription>{notice?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={closeNotice} className="w-full sm:w-auto">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="flex max-h-[80vh] w-[90%] flex-col rounded-2xl">
          <DialogHeader>
            <DialogTitle>Order history</DialogTitle>
            <DialogDescription>{tableName}</DialogDescription>
          </DialogHeader>

          {tableOrders.length > 0 && (
            <div className="flex items-center justify-between rounded-xl bg-secondary/50 px-4 py-3">
              <span className="text-sm font-semibold">
                Total across {tableOrders.length} {tableOrders.length === 1 ? "order" : "orders"}
              </span>
              <span className="text-lg font-bold">{fmt(tableOrdersTotal)}</span>
            </div>
          )}

          <div className="-mx-6 flex-1 space-y-4 overflow-y-auto px-6">
            {tableOrders.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No orders yet for this table.
              </p>
            ) : (
              tableOrders.map((order) => {
                const orderNet = order.total / (1 + order.taxRate / 100);
                const orderTax = order.total - orderNet;
                return (
                  <div key={order.id} className="rounded-xl border p-4 text-left">
                    <div className="flex items-center justify-between text-xs font-semibold tracking-wide text-muted-foreground">
                      <span>{order.code}</span>
                      <span>{tableName}</span>
                    </div>
                    {order.lines.map((line) => (
                      <div
                        key={line.itemId}
                        className="mt-2.5 flex items-start gap-3 border-t pt-2.5 text-sm"
                      >
                        <span className="w-6 font-bold text-muted-foreground/70">
                          {line.qty}×
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">
                            {line.name}
                            {line.note ? `, ${line.note}` : ""}
                          </span>
                          {dishes.find((d) => d.id === line.itemId)?.isVegan && (
                            <Badge className={cn(TONE_CLASSES.green, "mt-1")}>Vegan</Badge>
                          )}
                        </span>
                        <span className="font-semibold">{fmt(line.price * line.qty)}</span>
                      </div>
                    ))}
                    <div className="mt-3 flex justify-between border-t pt-3 text-[13px] text-muted-foreground">
                      <span>Net</span>
                      <span>{fmt(orderNet)}</span>
                    </div>
                    <div className="mt-1.5 flex justify-between text-[13px] text-muted-foreground">
                      <span>Tax ({order.taxRate}%)</span>
                      <span>{fmt(orderTax)}</span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between border-t pt-2.5">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="text-lg font-bold">{fmt(order.total)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setHistoryOpen(false)} className="w-full sm:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
