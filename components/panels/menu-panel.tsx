"use client";

import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlass, PencilSimple, Trash } from "@phosphor-icons/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Dish, TaxMode } from "@/lib/types";

const COMMON_TAX = "Common tax";

interface DishForm {
  name: string;
  price: string;
  taxMode: TaxMode;
  taxName: string;
  taxPct: string;
  catId: string;
  valid: boolean;
  description: string;
  imageUrl: string;
  isVegan: boolean;
}

export function MenuPanel({ createSignal }: { createSignal: number }) {
  const { workspace, fmt, saveDish, deleteDish } = useWorkspace();
  const { categories, dishes, settings } = workspace;
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [form, setForm] = useState<DishForm>({
    name: "",
    price: "",
    taxMode: "none",
    taxName: COMMON_TAX,
    taxPct: "",
    catId: "",
    valid: true,
    description: "",
    imageUrl: "",
    isVegan: false,
  });

  useEffect(() => {
    if (createSignal > 0) {
      setEditing(null);
      setForm({
        name: "",
        price: "",
        taxMode: "none",
        taxName: COMMON_TAX,
        taxPct: "",
        catId: categories[0]?.id ?? "",
        valid: true,
        description: "",
        imageUrl: "",
        isVegan: false,
      });
      setOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSignal]);

  const startEdit = (dish: Dish) => {
    setEditing(dish);
    setForm({
      name: dish.name,
      price: String(dish.price),
      taxMode: dish.taxMode,
      taxName: dish.taxName || COMMON_TAX,
      taxPct: dish.taxPct == null ? "" : String(dish.taxPct),
      catId: dish.catId,
      valid: dish.valid,
      description: dish.description ?? "",
      imageUrl: dish.imageUrl ?? "",
      isVegan: dish.isVegan ?? false,
    });
    setOpen(true);
  };

  const filtered = useMemo(
    () =>
      dishes.filter(
        (d) =>
          (categoryFilter === "all" || d.catId === categoryFilter) &&
          (!query || d.name.toLowerCase().includes(query.toLowerCase())),
      ),
    [dishes, categoryFilter, query],
  );

  const groups = categories
    .filter((c) => categoryFilter === "all" || c.id === categoryFilter)
    .map((category) => ({
      category,
      items: filtered.filter((d) => d.catId === category.id),
    }));

  const taxBadge = (dish: Dish) =>
    dish.taxMode === "include"
      ? `Incl. ${dish.taxName || "tax"}`
      : dish.taxMode === "exclude"
        ? `Excl. tax ${dish.taxPct ?? 0}%`
        : null;

  const submit = () => {
    if (!form.name.trim()) return;
    saveDish({
      id: editing?.id,
      name: form.name.trim(),
      price: Number(form.price) || 0,
      catId: form.catId || categories[0]?.id || "",
      valid: form.valid,
      taxMode: form.taxMode,
      taxName: form.taxMode === "include" ? form.taxName : undefined,
      taxPct: form.taxMode === "exclude" ? Number(form.taxPct) || 0 : undefined,
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      isVegan: form.isVegan,
    });
    setOpen(false);
  };

  const estimated =
    (Number(form.price) || 0) * (1 + (Number(form.taxPct) || 0) / 100);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-70">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dishes"
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
                <Badge
                  className={
                    category.valid
                      ? "bg-green-50 text-green-700"
                      : "bg-secondary text-muted-foreground"
                  }
                >
                  {category.valid ? "Valid" : "Hidden"}
                </Badge>
                <span className="flex-1" />
                <span className="text-[13px] font-normal text-muted-foreground">
                  {items.length} {items.length === 1 ? "dish" : "dishes"}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="border-t pb-0">
              {items.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">
                  No dishes in this category.
                </p>
              ) : (
                items.map((dish) => (
                  <div
                    key={dish.id}
                    className="grid grid-cols-[minmax(160px,1fr)_110px_100px_80px] items-center gap-3 border-b px-5 py-3 last:border-0"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>{dish.name}</span>
                      {dish.isVegan && (
                        <Badge className="rounded-md bg-green-50 text-green-700">Vegan</Badge>
                      )}
                      {taxBadge(dish) && (
                        <Badge className="rounded-md bg-amber-50 text-amber-700">
                          {taxBadge(dish)}
                        </Badge>
                      )}
                    </span>
                    <span className="font-semibold">{fmt(dish.price)}</span>
                    <span>
                      <Badge
                        className={
                          dish.valid
                            ? "bg-green-50 text-green-700"
                            : "bg-secondary text-muted-foreground"
                        }
                      >
                        {dish.valid ? "Valid" : "Hidden"}
                      </Badge>
                    </span>
                    <span className="flex justify-end gap-3.5">
                      <button
                        type="button"
                        onClick={() => startEdit(dish)}
                        className="text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={`Edit ${dish.name}`}
                      >
                        <PencilSimple size={15} weight="bold" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDish(dish.id)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                        aria-label={`Delete ${dish.name}`}
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                    </span>
                  </div>
                ))
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit dish" : "New dish"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="dish-name">Name</Label>
              <Input
                id="dish-name"
                value={form.name}
                placeholder="Dish name"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dish-price">Price ({settings.currency})</Label>
              <Input
                id="dish-price"
                type="number"
                value={form.price}
                placeholder="12.00"
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tax</Label>
              <Select
                value={form.taxMode}
                onValueChange={(taxMode: TaxMode) => setForm((f) => ({ ...f, taxMode }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="include">Include tax</SelectItem>
                  <SelectItem value="exclude">Exclude tax</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.taxMode === "include" && (
              <div className="space-y-1.5">
                <Label>Tax included in the price</Label>
                <Select
                  value={form.taxName}
                  onValueChange={(taxName) => setForm((f) => ({ ...f, taxName }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={COMMON_TAX}>
                      Common tax ({settings.taxRate}%)
                    </SelectItem>
                    {settings.specialTaxes.map((t) => (
                      <SelectItem key={t.name} value={t.name}>
                        {t.name} ({t.pct}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.taxMode === "exclude" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="dish-tax-pct">Tax added at checkout (%)</Label>
                  <Input
                    id="dish-tax-pct"
                    type="number"
                    value={form.taxPct}
                    placeholder="10"
                    onChange={(e) => setForm((f) => ({ ...f, taxPct: e.target.value }))}
                  />
                </div>
                <p className="rounded-lg border bg-secondary px-3 py-2.5 text-[13px] text-muted-foreground">
                  Estimated final price: {fmt(estimated)} · {fmt(Number(form.price) || 0)}{" "}
                  + {Number(form.taxPct) || 0}% tax
                </p>
              </>
            )}

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.catId}
                onValueChange={(catId) => setForm((f) => ({ ...f, catId }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dish-description">Description</Label>
              <Input
                id="dish-description"
                value={form.description}
                placeholder="Ingredients, prep notes…"
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dish-image-url">Image URL</Label>
              <Input
                id="dish-image-url"
                value={form.imageUrl}
                placeholder="https://…"
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              />
            </div>

            <Label className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={form.isVegan}
                onCheckedChange={(isVegan) => setForm((f) => ({ ...f, isVegan: isVegan === true }))}
              />
              Vegan
            </Label>

            <Label className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={form.valid}
                onCheckedChange={(valid) => setForm((f) => ({ ...f, valid: valid === true }))}
              />
              Valid — available to order
            </Label>
          </div>
          <DialogFooter>
            {editing && (
              <Button
                variant="ghost"
                className="mr-auto"
                onClick={() => {
                  deleteDish(editing.id);
                  setOpen(false);
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editing ? "Save dish" : "Create dish"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
