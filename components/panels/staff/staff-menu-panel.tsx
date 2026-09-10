"use client";

import { useMemo, useState } from "react";
import {
  BowlFood,
  Cake,
  ForkKnife,
  MagnifyingGlass,
  Minus,
  NotePencil,
  Plus,
  ShoppingCart,
  Trash,
  Wine,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/components/workspace-provider";
import { useAsyncAction } from "@/hooks/use-async-action";
import { TONE_CLASSES } from "@/lib/tone";
import { cn } from "@/lib/utils";
import type { Dish, DishStatus } from "@/lib/types";

const CATEGORY_ICONS: Record<string, PhosphorIcon> = {
  Starters: BowlFood,
  Mains: ForkKnife,
  Desserts: Cake,
  Drinks: Wine,
  Coffee: Wine,
  Bakery: Cake,
  Brunch: BowlFood,
};

const STATUS_LABEL: Record<DishStatus, string> = {
  valid: "Available",
  sold_out: "Sold out",
  hidden: "Hidden",
};

const STATUS_TONE: Record<DishStatus, keyof typeof TONE_CLASSES> = {
  valid: "green",
  sold_out: "amber",
  hidden: "gray",
};

export function StaffMenuPanel() {
  const { workspace, fmt, placeOrder, saveDish } = useWorkspace();
  const { categories, dishes } = workspace;
  const { run, isPending } = useAsyncAction();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteOpenId, setNoteOpenId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [tableName, setTableName] = useState("");
  const [placing, setPlacing] = useState(false);

  const changeStatus = (dish: Dish, status: DishStatus) =>
    run(`dish-status-${dish.id}`, () => saveDish({ ...dish, status }), "Failed to update dish status.");

  const filtered = useMemo(
    () => dishes.filter((d) => !query || d.name.toLowerCase().includes(query.toLowerCase())),
    [dishes, query],
  );

  const groups = categories
    .map((category) => ({ category, items: filtered.filter((d) => d.catId === category.id) }))
    .filter((g) => g.items.length || !query);

  const setQty = (dishId: string, qty: number) =>
    setCart((c) => {
      const next = { ...c };
      if (qty <= 0) delete next[dishId];
      else next[dishId] = qty;
      return next;
    });

  const cartLines = Object.entries(cart).map(([dishId, qty]) => {
    const dish = dishes.find((d) => d.id === dishId)!;
    return { itemId: dishId, qty, price: dish.price, name: dish.name, note: notes[dishId] };
  });
  const cartCount = cartLines.reduce((a, l) => a + l.qty, 0);
  const cartTotal = cartLines.reduce((a, l) => a + l.qty * l.price, 0);

  const resetCart = () => {
    setCart({});
    setNotes({});
    setNoteOpenId(null);
  };

  const handlePlaceOrder = async () => {
    if (!tableName || !cartCount) return;
    setPlacing(true);
    try {
      const lines = cartLines.map(({ itemId, qty, note }) => ({ itemId, qty, note }));
      await placeOrder(tableName, lines);
      resetCart();
      setCartOpen(false);
      setTableName("");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-80">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes"
            aria-label="Search dishes"
            className="pl-9"
          />
        </div>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setCartOpen(true)} disabled={!cartCount}>
          <ShoppingCart size={14} weight="bold" />
          Cart{cartCount > 0 ? ` · ${cartCount}` : ""}
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No dishes match.</p>
      ) : (
        <Accordion
          type="multiple"
          defaultValue={categories.map((c) => c.id)}
          className="space-y-3"
        >
          {groups.map(({ category, items }) => (
            <AccordionItem
              key={category.id}
              value={category.id}
              className="rounded-xl border bg-card px-0"
            >
              <AccordionTrigger className="px-5 py-4 hover:no-underline">
                <span className="flex flex-1 items-center gap-3">
                  <span className="text-lg font-semibold">{category.name}</span>
                  <span className="flex-1" />
                  <span className="text-[13px] font-normal text-muted-foreground">
                    {items.length} {items.length === 1 ? "dish" : "dishes"}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="border-t pb-0">
                <div className="space-y-3 p-4">
                  {items.map((dish) => {
                    const qty = cart[dish.id] ?? 0;
                    const noteOpen = noteOpenId === dish.id;
                    const noteText = notes[dish.id] ?? "";
                    const Icon = CATEGORY_ICONS[category.name] ?? ForkKnife;
                    const effectiveStatus = category.valid ? dish.status : "hidden";
                    const orderable = effectiveStatus === "valid";
                    return (
                      <div key={dish.id} className="flex gap-3 rounded-xl border bg-card p-3">
                        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-secondary/50 text-muted-foreground">
                          {dish.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={dish.imageUrl}
                              alt={dish.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <Icon size={28} weight="fill" />
                          )}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start gap-2.5">
                            <span className="flex-1 text-[15px] font-semibold">{dish.name}</span>
                            <span className="text-[15px] font-bold">{fmt(dish.price)}</span>
                          </div>
                          {dish.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                              {dish.description}
                            </p>
                          )}
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <Select
                              value={dish.status}
                              disabled={!category.valid || isPending(`dish-status-${dish.id}`)}
                              onValueChange={(status: DishStatus) => changeStatus(dish, status)}
                            >
                              <SelectTrigger
                                size="sm"
                                className={cn(
                                  "h-6 w-auto gap-1 rounded-full border-0 px-2.5 text-xs font-semibold",
                                  TONE_CLASSES[STATUS_TONE[effectiveStatus]],
                                )}
                              >
                                <SelectValue>
                                  {category.valid ? STATUS_LABEL[dish.status] : "Off menu"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="valid">Valid</SelectItem>
                                <SelectItem value="sold_out">Sold out</SelectItem>
                                <SelectItem value="hidden">Hidden</SelectItem>
                              </SelectContent>
                            </Select>
                            {dish.isVegan && (
                              <Badge className={TONE_CLASSES.green}>Vegan</Badge>
                            )}
                          </div>

                          {noteOpen ? (
                            <div className="mt-2">
                              <textarea
                                value={noteText}
                                onChange={(e) =>
                                  setNotes((n) => ({ ...n, [dish.id]: e.target.value }))
                                }
                                placeholder="Note for the kitchen"
                                rows={2}
                                className="w-full resize-none rounded-lg border bg-background p-2 text-sm outline-none focus:border-brand-500"
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
                                  className="text-[12px] font-semibold text-muted-foreground"
                                >
                                  Clear
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNoteOpenId(null)}
                                  className="text-[12px] font-bold text-brand-500"
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          ) : (
                            noteText && (
                              <div className="mt-2 flex items-start gap-1.5 rounded-md bg-brand-50 px-2 py-1.5 text-xs text-brand-600">
                                <NotePencil size={12} weight="bold" className="mt-px shrink-0" />
                                {noteText}
                              </div>
                            )
                          )}

                          <div className="flex-1" />
                          <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setNoteOpenId(noteOpen ? null : dish.id)}
                              disabled={!orderable}
                              className={cn(
                                "flex size-8 items-center justify-center rounded-full border disabled:cursor-not-allowed disabled:opacity-40",
                                noteOpen || noteText
                                  ? "border-brand-500 bg-brand-50 text-brand-600"
                                  : "border-border text-muted-foreground",
                              )}
                              aria-label={`Note for ${dish.name}`}
                            >
                              <NotePencil size={14} weight="bold" />
                            </button>
                            {qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => setQty(dish.id, 1)}
                                disabled={!orderable}
                                className="flex h-8 items-center gap-1.5 rounded-full bg-brand-500 px-3 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Plus size={13} weight="bold" />
                                Add
                              </button>
                            ) : (
                              <span className="flex items-center gap-1 rounded-full bg-brand-50 p-[3px]">
                                <button
                                  type="button"
                                  onClick={() => setQty(dish.id, qty - 1)}
                                  className="flex size-6.5 items-center justify-center rounded-full bg-background text-brand-600"
                                  aria-label={`Decrease ${dish.name}`}
                                >
                                  <Minus size={12} weight="bold" />
                                </button>
                                <span className="min-w-4.5 text-center text-sm font-bold text-brand-600">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setQty(dish.id, qty + 1)}
                                  className="flex size-6.5 items-center justify-center rounded-full bg-brand-500 text-white"
                                  aria-label={`Increase ${dish.name}`}
                                >
                                  <Plus size={12} weight="bold" />
                                </button>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {cartCount > 0 && !cartOpen && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed right-6 bottom-6 flex h-13 items-center gap-3 rounded-2xl bg-brand-500 px-5 text-white shadow-lg"
        >
          <ShoppingCart size={18} weight="bold" />
          <span className="font-bold">{cartCount} {cartCount === 1 ? "item" : "items"}</span>
          <span className="font-bold">{fmt(cartTotal)}</span>
        </button>
      )}

      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New order</DialogTitle>
          </DialogHeader>

          {cartLines.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Your cart is empty.</p>
          ) : (
            <div className="space-y-1">
              {cartLines.map((line) => (
                <div key={line.itemId} className="flex items-center gap-3 border-t py-2.5 first:border-0">
                  <span className="flex-1 text-sm">
                    {line.name}
                    {line.note && (
                      <span className="block text-[12px] text-muted-foreground">{line.note}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-secondary p-0.75">
                    <button
                      type="button"
                      onClick={() => setQty(line.itemId, line.qty - 1)}
                      className="flex size-6.5 items-center justify-center rounded-full bg-white text-foreground"
                      aria-label={`Decrease ${line.name}`}
                    >
                      <Minus size={12} weight="bold" />
                    </button>
                    <span className="min-w-4.5 text-center text-sm font-bold">{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(line.itemId, line.qty + 1)}
                      className="flex size-6.5 items-center justify-center rounded-full bg-brand-500 text-white"
                      aria-label={`Increase ${line.name}`}
                    >
                      <Plus size={12} weight="bold" />
                    </button>
                  </span>
                  <span className="w-16 text-right font-semibold">
                    {fmt(line.price * line.qty)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(line.itemId, 0)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label={`Remove ${line.name}`}
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                </div>
              ))}

              <div className="space-y-1.5 border-t pt-3.5">
                <Label>Table</Label>
                <Select value={tableName} onValueChange={setTableName}>
                  <SelectTrigger className="w-full" aria-label="Table">
                    <SelectValue placeholder="Pick a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspace.tables.map((t) => (
                      <SelectItem key={t.id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between border-t pt-3.5">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-bold">{fmt(cartTotal)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            {cartLines.length > 0 && (
              <Button variant="ghost" className="mr-auto" onClick={resetCart}>
                Clear cart
              </Button>
            )}
            <Button variant="outline" onClick={() => setCartOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePlaceOrder}
              disabled={!tableName || !cartCount || placing}
            >
              {placing ? "Placing…" : "Place order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
