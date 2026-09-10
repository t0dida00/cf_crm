"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BowlFood,
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
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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

  const [tab, setTab] = useState(validCategories[0]?.id ?? "");
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

  const activeCategory = validCategories.find((c) => c.id === tab) ?? validCategories[0];
  const items = dishes
    .filter((d) => d.catId === activeCategory?.id)
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "valid" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

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

  if (screen === "done" && placed) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-secondary/30 px-4 py-10 sm:py-16">
        <div className="flex w-full max-w-md flex-1 flex-col items-center justify-center text-center sm:flex-none">
          <div className="flex size-16 items-center rounded-full bg-brand-50 text-brand-500 sm:size-19">
            <CheckCircle size={100} weight="fill" />
          </div>
          <h1 className="mt-6 text-xl font-bold sm:text-2xl">Thanks for your order</h1>
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
                className="mt-2.5 flex items-center gap-3 border-t pt-2.5 text-sm"
              >
                <span className="w-6 font-bold text-muted-foreground/70">{line.qty}×</span>
                <span className="flex-1 truncate">
                  {line.name}
                  {dishes.find((d) => d.id === line.itemId)?.isVegan && (
                    <Badge className={cn(TONE_CLASSES.green, "ml-1.5")}>Vegan</Badge>
                  )}
                  {line.note ? ` · ${line.note}` : ""}
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
            className="mt-5 text-sm font-bold text-brand-500"
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
              className="flex size-8 shrink-0 items-center justify-center rounded-full border text-muted-foreground"
            >
              <ArrowLeft size={16} weight="bold" />
            </button>
            <h1 className="text-[17px] font-bold">Your order</h1>
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
                  <div className="hidden w-6 shrink-0 pt-0.5 text-[13px] font-bold text-muted-foreground/40 sm:block">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border bg-secondary/50 text-muted-foreground sm:size-[100px]">
                    <Icon size={28} weight="fill" className="sm:size-[30px]" />
                  </div>
                  <div className="flex min-w-0 flex-1 items-stretch justify-between gap-2">
                    <div className="flex min-w-0 flex-col ">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[15px] font-semibold">{line.name}</span>
                          {dish?.isVegan && (
                            <Badge className={cn(TONE_CLASSES.green, "shrink-0")}>Vegan</Badge>
                          )}
                        </div>
                        {line.note && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-brand-600">
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
                        onClick={() => setQty(line.itemId, 0)}
                        aria-label={`Remove ${line.name}`}
                        className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                      <span className="font-semibold">{fmt(line.price * line.qty)}</span>
                      <span className="flex items-center gap-1 rounded-full bg-brand-50 p-[3px]">
                        <button
                          type="button"
                          onClick={() => setQty(line.itemId, line.qty - 1)}
                          className="flex size-7 items-center justify-center rounded-full bg-background text-brand-600"
                        >
                          <Minus size={13} weight="bold" />
                        </button>
                        <span className="min-w-5 text-center text-sm font-bold text-brand-600">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(line.itemId, line.qty + 1)}
                          className="flex size-7 items-center justify-center rounded-full bg-brand-500 text-white"
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
              <p className="mb-3 text-center text-[13px] text-destructive">{orderError}</p>
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
                    ? "bg-brand-500"
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
    <div className="flex min-h-screen flex-col bg-secondary/20">
      <header className="sticky top-0 z-10 border-b bg-card px-4 pt-3 pb-3 sm:px-6">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-2.5">
          <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-500 text-white">
            {workspaceLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={workspaceLogoUrl} alt="" className="size-full object-cover" />
            ) : (
              <ForkKnife size={30} weight="bold" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold tracking-tight">{workspaceName}</div>
            {workspaceAddress || workspacePhone ? (
              <div className="flex flex-col gap-0.5">
                {workspaceAddress && (
                  <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin size={11} weight="bold" className="shrink-0" />
                    <span className="truncate">{workspaceAddress}</span>
                  </div>
                )}
                {workspacePhone && (
                  <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <Phone size={11} weight="bold" className="shrink-0" />
                    <span className="truncate">{workspacePhone}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="truncate text-xs text-muted-foreground">
                Scan to order · no app needed
              </div>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[13px] font-bold text-brand-600">
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
              "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-semibold transition-colors active:bg-brand-500 active:text-white active:border-brand-500",
              activeAction === "staff"
                ? "border-brand-500 bg-brand-500 text-white"
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
              "flex flex-1 items-center justify-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-semibold transition-colors active:bg-brand-500 active:text-white active:border-brand-500",
              activeAction === "checkout"
                ? "border-brand-500 bg-brand-500 text-white"
                : "border-border text-foreground",
            )}
          >
            <Receipt size={15} weight="bold" />
            Checkout
          </button>
        </div>

        {canOrder && (
          <div className="mx-auto mt-2 flex w-full max-w-2xl">
            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-3 py-2 text-[13px] font-semibold text-foreground"
            >
              <ClockCounterClockwise size={15} weight="bold" />
              Order history
              {tableOrders.length > 0 && (
                <span className="ml-1 flex min-w-4.5 items-center justify-center rounded-full bg-secondary px-1 text-[11px] font-bold text-muted-foreground">
                  {tableOrders.length}
                </span>
              )}
            </button>
          </div>
        )}

        <div className="mx-auto mt-3.5 flex w-full max-w-2xl gap-2 overflow-x-auto">
          {validCategories.map((c) => {
            const active = c.id === activeCategory?.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setTab(c.id)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-[13px] font-medium transition-colors",
                  active
                    ? "border-foreground bg-foreground text-white font-bold"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 space-y-3 p-4 pb-28 sm:p-6">
        {items.map((dish, i) => {
          const Icon = CATEGORY_ICONS[activeCategory?.name ?? ""] ?? ForkKnife;
          const qty = cart[dish.id] ?? 0;
          const noteOpen = noteOpenId === dish.id;
          const noteText = notes[dish.id] ?? "";
          const soldOut = dish.status === "sold_out";
          return (
            <div
              key={dish.id}
              className={cn(
                "relative flex gap-3 rounded-xl border bg-card p-3",
                soldOut && "opacity-60",
              )}
            >
              {qty > 0 && (
                <button
                  type="button"
                  onClick={() => setQty(dish.id, 0)}
                  aria-label={`Remove ${dish.name}`}
                  className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-destructive"
                >
                  <Trash size={15} weight="bold" />
                </button>
              )}
              <div className="hidden w-6 shrink-0 pt-0.5 text-[13px] font-bold text-muted-foreground/40 sm:block">
                {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-secondary/50 text-muted-foreground sm:size-[100px]">
                {dish.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={dish.imageUrl}
                    alt=""
                    className="size-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <Icon
                  size={28}
                  weight="fill"
                  className={cn("sm:size-[30px]", dish.imageUrl && "hidden")}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1.5 pr-8">
                  <span className="text-[15px] font-semibold">{dish.name}</span>
                  {dish.isVegan && (
                    <Badge className={cn(TONE_CLASSES.green, "shrink-0")}>Vegan</Badge>
                  )}
                  {soldOut && (
                    <Badge className={cn(TONE_CLASSES.amber, "shrink-0")}>Sold out</Badge>
                  )}
                </div>
                {dish.description && (
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {dish.description}
                  </div>
                )}
                {noteOpen ? (
                  <div className="mt-2">
                    <textarea
                      value={noteText}
                      onChange={(e) =>
                        setNotes((n) => ({ ...n, [dish.id]: e.target.value }))
                      }
                      placeholder="Add a note for the kitchen, e.g. no onion"
                      rows={2}
                      className="w-full resize-none rounded-lg border bg-background p-2 text-base outline-none focus:border-brand-500"
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
                      <button
                        type="button"
                        onClick={() => setNoteOpenId(null)}
                        className="text-[13px] font-bold text-brand-500"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  noteText && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-md bg-brand-50 px-2.5 py-1.5 text-xs text-brand-600">
                      <NotePencil size={13} weight="bold" className="mt-px shrink-0" />
                      {noteText}
                    </div>
                  )
                )}
                <div className="flex-1" />
                <div className="mt-2 flex flex-wrap items-end gap-2.5">
                  <span className="text-[15px] font-bold">{fmt(dish.price)}</span>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => setNoteOpenId(noteOpen ? null : dish.id)}
                    className={cn(
                      "flex size-[34px] items-center justify-center rounded-full border",
                      noteOpen || noteText
                        ? "border-brand-500 bg-brand-50 text-brand-600"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    <NotePencil size={15} weight="bold" />
                  </button>
                  {soldOut ? (
                    <span className="flex h-[34px] items-center rounded-full bg-secondary px-3.5 text-[13px] font-bold text-muted-foreground">
                      Sold out
                    </span>
                  ) : qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => setQty(dish.id, 1)}
                      className="flex h-[34px] items-center gap-1.5 rounded-full bg-brand-500 px-3.5 text-[13px] font-bold text-white"
                    >
                      <Plus size={13} weight="bold" />
                      Add
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-brand-50 p-[3px]">
                      <button
                        type="button"
                        onClick={() => setQty(dish.id, qty - 1)}
                        className="flex size-7 items-center justify-center rounded-full bg-background text-brand-600"
                      >
                        <Minus size={13} weight="bold" />
                      </button>
                      <span className="min-w-5 text-center text-sm font-bold text-brand-600">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(dish.id, qty + 1)}
                        className="flex size-7 items-center justify-center rounded-full bg-brand-500 text-white"
                      >
                        <Plus size={13} weight="bold" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </main>

      <footer className="fixed inset-x-0 bottom-0 border-t bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto w-full max-w-2xl">
          <button
            type="button"
            disabled={!cartCount}
            onClick={() => setScreen("review")}
            className={cn(
              "flex h-13 w-full items-center rounded-2xl px-5 text-base font-bold text-white transition-colors",
              cartCount ? "bg-brand-500" : "cursor-not-allowed bg-muted-foreground/30",
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
            <div className="flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand-500">
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
                        className="mt-2.5 flex items-center gap-3 border-t pt-2.5 text-sm"
                      >
                        <span className="w-6 font-bold text-muted-foreground/70">
                          {line.qty}×
                        </span>
                        <span className="flex-1 truncate">
                          {line.name}
                          {dishes.find((d) => d.id === line.itemId)?.isVegan && (
                            <Badge className={cn(TONE_CLASSES.green, "ml-1.5")}>Vegan</Badge>
                          )}
                          {line.note ? ` · ${line.note}` : ""}
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
