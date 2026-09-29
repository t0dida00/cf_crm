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
} from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { bestSellerIds } from "@/lib/bestSellers";
import { TONE_CLASSES } from "@/lib/tone";
import { cn } from "@/lib/utils";
import type { Dish, DishStatus } from "@/lib/types";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { DishImage } from "@/components/common/DishImage";
import { useTranslation } from "react-i18next";

const CATEGORY_ICONS: Record<string, PhosphorIcon> = {
  Starters: BowlFood,
  Mains: ForkKnife,
  Desserts: Cake,
  Drinks: Wine,
  Coffee: Wine,
  Bakery: Cake,
  Brunch: BowlFood,
};

const STATUSES: DishStatus[] = ["valid", "sold_out", "hidden"];

const STATUS_TONE: Record<DishStatus, keyof typeof TONE_CLASSES> = {
  valid: "green",
  sold_out: "amber",
  hidden: "gray",
};

export function StaffMenuPanel() {
  const { workspace, fmt, placeOrder, saveDish } = useWorkspace();
  const { categories, dishes } = workspace;
  const { t } = useTranslation();
  const { run, isPending } = useAsyncAction();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [noteOpenId, setNoteOpenId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [tableName, setTableName] = useState("");
  const [placing, setPlacing] = useState(false);

  const changeStatus = (dish: Dish, status: DishStatus) =>
    run(`dish-status-${dish.id}`, () => saveDish({ ...dish, status }), t("staff.menu.statusFailed"));

  const bestSellers = useMemo(() => bestSellerIds(dishes, categories), [dishes, categories]);

  const filtered = useMemo(
    () => dishes.filter((d) => !debouncedQuery || d.name.toLowerCase().includes(debouncedQuery.toLowerCase())),
    [dishes, debouncedQuery],
  );

  const groups = categories
    .map((category) => ({ category, items: filtered.filter((d) => d.catId === category.id) }))
    .filter((g) => g.items.length || !debouncedQuery);

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
            placeholder={t("staff.menu.search")}
            aria-label={t("staff.menu.search")}
            className="pl-9"
          />
        </div>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setCartOpen(true)} disabled={!cartCount}>
          <ShoppingCart size={14} weight="bold" />
          {cartCount > 0 ? t("staff.menu.cartCount", { n: cartCount }) : t("staff.menu.cart")}
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">{t("staff.menu.noMatch")}</p>
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
                    {t("admin.menu.dishes", { count: items.length, n: items.length })}
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
                        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-secondary/50 text-muted-foreground">
                          {dish.imageUrl ? (
                            <DishImage
                              src={dish.imageUrl}
                              alt="" // the name is shown right beside it
                              sizes="80px"
                              fallback={<Icon size={28} weight="fill" />}
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
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <Select
                              value={dish.status}
                              disabled={!category.valid || isPending(`dish-status-${dish.id}`)}
                              onValueChange={(status: DishStatus) => changeStatus(dish, status)}
                            >
                              <SelectTrigger
                                size="sm"
                                aria-label={t("staff.menu.statusOf", { name: dish.name })}
                                className={cn(
                                  "h-6 w-auto gap-1 rounded-full border-0 px-2.5 text-xs font-semibold",
                                  TONE_CLASSES[STATUS_TONE[effectiveStatus]],
                                )}
                              >
                                <SelectValue>
                                  {category.valid ? t(`admin.menu.status.${dish.status}`) : t("staff.menu.offMenu")}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {STATUSES.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {t(`admin.menu.status.${status}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {dish.isVegan && (
                              <Badge className={TONE_CLASSES.green}>{t("common.tags.vegan")}</Badge>
                            )}
                            {bestSellers.has(dish.id) && (
                              <Badge className={TONE_CLASSES.brand}>{t("common.tags.bestSeller")}</Badge>
                            )}
                          </div>
                          {/* Name, then its tags, then the description: the same order in every app. */}
                          {dish.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {dish.description}
                            </p>
                          )}

                          {noteOpen ? (
                            <div className="mt-2">
                              <textarea
                                aria-label={t("staff.menu.noteFor", { name: dish.name })}
                                value={noteText}
                                onChange={(e) =>
                                  setNotes((n) => ({ ...n, [dish.id]: e.target.value }))
                                }
                                placeholder={t("staff.menu.notePlaceholder")}
                                rows={2}
                                className="w-full resize-none rounded-lg border border-input-border bg-background p-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
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
                                  {t("staff.menu.clear")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNoteOpenId(null)}
                                  className="text-[12px] font-bold text-brand-700"
                                >
                                  {t("staff.menu.done")}
                                </button>
                              </div>
                            </div>
                          ) : (
                            noteText && (
                              <div className="mt-2 flex items-start gap-1.5 rounded-md bg-brand-50 px-2 py-1.5 text-xs text-brand-700">
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
                                  ? "border-brand-500 bg-brand-50 text-brand-700"
                                  : "border-border text-muted-foreground",
                              )}
                              aria-label={t("staff.menu.noteButton", { name: dish.name })}
                              aria-expanded={noteOpen}
                            >
                              <NotePencil size={14} weight="bold" />
                            </button>
                            {qty === 0 ? (
                              <button
                                type="button"
                                onClick={() => setQty(dish.id, 1)}
                                disabled={!orderable}
                                className="flex h-8 items-center gap-1.5 rounded-full bg-brand-700 px-3 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Plus size={13} weight="bold" />
                                {t("staff.menu.add")}
                              </button>
                            ) : (
                              <span className="flex items-center gap-1 rounded-full bg-brand-50 p-[3px]">
                                <button
                                  type="button"
                                  onClick={() => setQty(dish.id, qty - 1)}
                                  className="flex size-6.5 items-center justify-center rounded-full border bg-background text-brand-700"
                                  aria-label={t("staff.menu.decrease", { name: dish.name })}
                                >
                                  <Minus size={12} weight="bold" />
                                </button>
                                <span className="min-w-4.5 text-center text-sm font-bold text-brand-700">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setQty(dish.id, qty + 1)}
                                  className="flex size-6.5 items-center justify-center rounded-full bg-brand-700 text-white"
                                  aria-label={t("staff.menu.increase", { name: dish.name })}
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
          className="fixed right-6 bottom-6 flex h-13 items-center gap-3 rounded-2xl bg-brand-700 px-5 text-white shadow-lg"
        >
          <ShoppingCart size={18} weight="bold" />
          <span className="font-bold">{t("admin.dashboard.items", { count: cartCount, n: cartCount })}</span>
          <span className="font-bold">{fmt(cartTotal)}</span>
        </button>
      )}

      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("staff.menu.newOrder")}</DialogTitle>
          </DialogHeader>

          {cartLines.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t("staff.menu.empty")}</p>
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
                      className="flex size-6.5 items-center justify-center rounded-full border bg-white text-foreground"
                      aria-label={t("staff.menu.decrease", { name: line.name })}
                    >
                      <Minus size={12} weight="bold" />
                    </button>
                    <span className="min-w-4.5 text-center text-sm font-bold">{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(line.itemId, line.qty + 1)}
                      className="flex size-6.5 items-center justify-center rounded-full bg-brand-700 text-white"
                      aria-label={t("staff.menu.increase", { name: line.name })}
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
                    aria-label={t("staff.menu.remove", { name: line.name })}
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                </div>
              ))}

              <div className="space-y-1.5 border-t pt-3.5">
                <Label htmlFor="staff-menu-table">{t("staff.menu.table")}</Label>
                <Select value={tableName} onValueChange={setTableName}>
                  <SelectTrigger id="staff-menu-table" className="w-full">
                    <SelectValue placeholder={t("staff.menu.pickTable")} />
                  </SelectTrigger>
                  <SelectContent>
                    {workspace.tables.map((table) => (
                      <SelectItem key={table.id} value={table.name}>
                        {table.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between border-t pt-3.5">
                <span className="text-sm font-semibold">{t("staff.menu.total")}</span>
                <span className="text-lg font-bold">{fmt(cartTotal)}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            {cartLines.length > 0 && (
              <Button variant="ghost" className="mr-auto" onClick={resetCart}>
                {t("staff.menu.clearCart")}
              </Button>
            )}
            <Button variant="outline" onClick={() => setCartOpen(false)}>
              {t("staff.menu.cancel")}
            </Button>
            <Button
              onClick={handlePlaceOrder}
              disabled={!tableName || !cartCount || placing}
            >
              {placing ? t("staff.menu.placing") : t("staff.menu.place")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
