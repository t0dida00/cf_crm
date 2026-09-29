"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DownloadSimple, EyeSlash, FileCsv, ImageSquare, MagnifyingGlass, PencilSimple, Trash, UploadSimple } from "@phosphor-icons/react";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RequiredLabel } from "@/components/common/RequiredLabel";
import { Textarea } from "@/components/ui/Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { SAVED_MESSAGE, useAsyncAction } from "@/hooks/useAsyncAction";
import type { Dish, DishStatus, TaxMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { DishImage } from "@/components/common/DishImage";
import { FieldError, fieldErrorProps } from "@/components/common/FieldError";
import { blockInvalidNumberKeys, validateDish, type FieldErrors, acceptNumberInput, MAX_SPECIAL_TAX, withFieldError } from "@/lib/validation";
import { formatNumber } from "@/lib/format";
import { COMMON_TAX, menuToCsv, SAMPLE_MENU_CSV } from "@/lib/menuCsv";
import { decodeCsvFile } from "@/lib/csv";
import { downloadFile } from "@/lib/downloadFile";
import { MenuImportDialog, type MenuFile } from "./MenuImportDialog";

/** "Khoa Restaurant" → "khoa-restaurant", for file names. */
const fileSlug = (name: string) => name.trim().replace(/\s+/g, "-").toLowerCase() || "tably";


// The same words as the staff menu.
const STATUS_LABEL: Record<DishStatus, string> = {
  valid: "Available",
  sold_out: "Sold out",
  hidden: "Hidden",
};

/* Only what needs attention gets a tag: available dishes show none. Hidden is
 * a choice, not a fault, so it's grey rather than red. */
const STATUS_TONE: Record<Exclude<DishStatus, "valid">, string> = {
  sold_out: "bg-amber-50 text-amber-700",
  hidden: "bg-secondary text-muted-foreground",
};

const STATUS_RADIO_TONE: Record<DishStatus, string> = {
  valid: "border-green-500 has-checked:bg-green-50 has-checked:text-green-700",
  sold_out: "border-amber-500 has-checked:bg-amber-50 has-checked:text-amber-700",
  hidden: "border-input-border has-checked:bg-secondary has-checked:text-foreground",
};

const STATUS_DOT_TONE: Record<DishStatus, string> = {
  valid: "bg-green-500",
  sold_out: "bg-amber-500",
  hidden: "bg-muted-foreground",
};

interface DishForm {
  name: string;
  price: string;
  taxMode: TaxMode;
  taxName: string;
  taxPct: string;
  catId: string;
  status: DishStatus;
  description: string;
  imageUrl: string;
  isVegan: boolean;
}

export function MenuPanel({ createSignal }: { createSignal: number }) {
  const { workspace, fmt, saveDish, deleteDish } = useWorkspace();
  const { run, isPending } = useAsyncAction();
  const { categories, dishes, settings } = workspace;
  const fileInput = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<MenuFile | null>(null);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Dish | null>(null);
  const [errors, setErrors] = useState<FieldErrors<"name" | "price" | "catId" | "taxPct">>({});
  const [form, setForm] = useState<DishForm>({
    name: "",
    price: "",
    taxMode: "none",
    taxName: COMMON_TAX,
    taxPct: "",
    catId: "",
    status: "valid",
    description: "",
    imageUrl: "",
    isVegan: false,
  });

  useEffect(() => {
    if (createSignal > 0) {
      setEditing(null);
      setErrors({});
      setForm({
        name: "",
        price: "",
        taxMode: "none",
        taxName: COMMON_TAX,
        taxPct: "",
        // Category is required and picked on purpose, not defaulted.
        catId: "",
        status: "valid",
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
    setErrors({});
    setForm({
      name: dish.name,
      price: String(dish.price),
      taxMode: dish.taxMode,
      taxName: dish.taxName || COMMON_TAX,
      taxPct: dish.taxPct == null ? "" : String(dish.taxPct),
      catId: dish.catId,
      status: dish.status,
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
          (!debouncedQuery || d.name.toLowerCase().includes(debouncedQuery.toLowerCase())),
      ),
    [dishes, categoryFilter, debouncedQuery],
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

  const submit = async () => {
    // Only an "exclude" tax has its own percentage to check.
    const found = validateDish({ ...form, taxPct: form.taxMode === "exclude" ? form.taxPct : "" });
    setErrors(found);
    if (Object.keys(found).length) return;
    const ok = await run("save-dish", () =>
      saveDish({
        id: editing?.id,
        name: form.name.trim(),
        price: Number(form.price) || 0,
        catId: form.catId,
        status: form.status,
        taxMode: form.taxMode,
        taxName: form.taxMode === "include" ? form.taxName : undefined,
        taxPct: form.taxMode === "exclude" ? Number(form.taxPct) || 0 : undefined,
        description: form.description.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        isVegan: form.isVegan,
      }), undefined, SAVED_MESSAGE
    );
    if (ok) setOpen(false);
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
            aria-label="Search dishes"
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-52" aria-label="Filter by category">
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
        {/* The whole menu as a CSV file: in, out, and an example of the format. */}
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
            <UploadSimple size={14} weight="bold" aria-hidden />
            Import CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!dishes.length}
            onClick={() => downloadFile(menuToCsv(categories, dishes), `${fileSlug(workspace.name)}-menu.csv`)}
          >
            <DownloadSimple size={14} weight="bold" aria-hidden />
            Export CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={() => downloadFile(SAMPLE_MENU_CSV, "menu-sample.csv")}>
            <FileCsv size={14} weight="bold" aria-hidden />
            Sample file
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            aria-label="Menu CSV file"
            onChange={async (e) => {
              const picked = e.target.files?.[0];
              e.target.value = ""; // picking the same file again still opens the preview
              if (!picked) return;
              // Strict UTF-8: a file in another encoding is refused with how to fix it.
              try {
                setImportFile({ name: picked.name, text: decodeCsvFile(await picked.arrayBuffer()) });
              } catch (err) {
                setImportFile({ name: picked.name, error: err instanceof Error ? err.message : String(err) });
              }
            }}
          />
        </div>
      </div>

      <MenuImportDialog file={importFile} onClose={() => setImportFile(null)} />

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
                {!category.valid && (
                  <Badge className="gap-1 bg-secondary text-muted-foreground">
                    <EyeSlash size={12} weight="bold" aria-hidden />
                    Hidden
                  </Badge>
                )}
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
                  <div key={dish.id} className="overflow-x-auto border-b last:border-0">
                  <div
                    className="grid min-w-[450px] grid-cols-[minmax(160px,1fr)_110px_100px_80px] items-center gap-3 px-5 py-3"
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="relative flex size-[108px] shrink-0 items-center justify-center overflow-hidden rounded-md border bg-secondary/50 text-muted-foreground">
                        {dish.imageUrl ? (
                          <DishImage
                            src={dish.imageUrl}
                            alt="" // the name is shown right beside it
                            sizes="108px"
                            fallback={<ImageSquare size={48} />}
                          />
                        ) : (
                          <ImageSquare size={48} />
                        )}
                      </span>
                      {/* Name, then its tags, then the description: the same order in every app. */}
                      <span className="flex min-w-0 flex-col items-start gap-1">
                        <span>{dish.name}</span>
                        {(dish.isVegan || taxBadge(dish)) && (
                          <span className="flex flex-wrap gap-1.5">
                            {dish.isVegan && (
                              <Badge className="rounded-md bg-green-50 text-green-700">Vegan</Badge>
                            )}
                            {taxBadge(dish) && (
                              <Badge className="rounded-md border border-input-border bg-transparent text-muted-foreground">
                                {taxBadge(dish)}
                              </Badge>
                            )}
                          </span>
                        )}
                        {dish.description && (
                          <span className="line-clamp-2 max-w-prose text-sm text-muted-foreground">
                            {dish.description}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className="flex flex-col">
                      <span className="font-semibold">{fmt(dish.price)}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatNumber(dish.soldCount ?? 0)} sold
                      </span>
                    </span>
                    <span>
                      {!category.valid ? (
                        <Badge className={cn("gap-1", STATUS_TONE.hidden)}>
                          <EyeSlash size={12} weight="bold" aria-hidden />
                          Hidden with category
                        </Badge>
                      ) : dish.status !== "valid" ? (
                        <Badge className={cn("gap-1", STATUS_TONE[dish.status])}>
                          {dish.status === "hidden" && <EyeSlash size={12} weight="bold" aria-hidden />}
                          {STATUS_LABEL[dish.status]}
                        </Badge>
                      ) : null}
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
                        disabled={isPending(`delete-${dish.id}`)}
                        onClick={() =>
                          run(`delete-${dish.id}`, () => deleteDish(dish.id), "Failed to delete dish.")
                        }
                        className="text-muted-foreground transition-colors hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                        aria-label={`Delete ${dish.name}`}
                      >
                        <Trash size={15} weight="bold" />
                      </button>
                    </span>
                  </div>
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
            <div className="flex justify-center">
              <ImageDropzone
                label="dish photo"
                key={editing?.id ?? "new"}
                value={form.imageUrl}
                onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))}
                // Fixed size: the dropzone's wrapper has no width of its own, so a
                // w-full box collapses to a dot once the photo (absolutely positioned) replaces the placeholder.
                className="size-48"
              />
            </div>

            <div className="space-y-1.5">
              <RequiredLabel htmlFor="dish-name">Name</RequiredLabel>
              <Input
                id="dish-name"
                required
                value={form.name}
                placeholder="Dish name"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                {...fieldErrorProps("dish-name", errors.name)}
                onBlur={() => setErrors((e) => withFieldError(e, "name", validateDish({ ...form, taxPct: form.taxMode === "exclude" ? form.taxPct : "" }).name))}
              />
              <FieldError id="dish-name" message={errors.name} />
            </div>
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="dish-price">Price ({settings.currency})</RequiredLabel>
              <Input
                id="dish-price"
                type="number"
                min={0}
                step="0.01"
                required
                value={form.price}
                onKeyDown={blockInvalidNumberKeys()}
                placeholder="12.00"
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                {...fieldErrorProps("dish-price", errors.price)}
                onBlur={() => setErrors((e) => withFieldError(e, "price", validateDish({ ...form, taxPct: form.taxMode === "exclude" ? form.taxPct : "" }).price))}
              />
              <FieldError id="dish-price" message={errors.price} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="menu-panel-tax">Tax</Label>
              <Select
                value={form.taxMode}
                onValueChange={(taxMode: TaxMode) => setForm((f) => ({ ...f, taxMode }))}
              >
                <SelectTrigger id="menu-panel-tax" className="w-full">
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
                <Label htmlFor="menu-panel-tax-included-in-the-price">Tax included in the price</Label>
                <Select
                  value={form.taxName}
                  onValueChange={(taxName) => setForm((f) => ({ ...f, taxName }))}
                >
                  <SelectTrigger id="menu-panel-tax-included-in-the-price" className="w-full">
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
                    min={0}
                    max={MAX_SPECIAL_TAX}
                    step="0.01"
                    value={form.taxPct}
                    placeholder="10"
                    onKeyDown={blockInvalidNumberKeys()}
                    onChange={(e) => {
                      const taxPct = acceptNumberInput(e.target.value, MAX_SPECIAL_TAX);
                      if (taxPct !== null) setForm((f) => ({ ...f, taxPct }));
                    }}
                    {...fieldErrorProps("dish-tax-pct", errors.taxPct)}
                    onBlur={() => setErrors((e) => withFieldError(e, "taxPct", validateDish({ ...form, taxPct: form.taxMode === "exclude" ? form.taxPct : "" }).taxPct))}
                  />
                  <FieldError id="dish-tax-pct" message={errors.taxPct} />
                </div>
                <p className="rounded-lg border bg-secondary px-3 py-2.5 text-[13px] text-muted-foreground">
                  Estimated final price: {fmt(estimated)} · {fmt(Number(form.price) || 0)}{" "}
                  + {Number(form.taxPct) || 0}% tax
                </p>
              </>
            )}

            <div className="space-y-1.5">
              <RequiredLabel htmlFor="dish-category">Category</RequiredLabel>
              <Select
                value={form.catId}
                onValueChange={(catId) => setForm((f) => ({ ...f, catId }))}
              >
                <SelectTrigger id="dish-category" className="w-full" {...fieldErrorProps("dish-category", errors.catId)}>
                  <SelectValue placeholder={categories.length ? "Pick a category" : "Add a category first"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError id="dish-category" message={errors.catId} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dish-description">Description</Label>
              <Textarea
                id="dish-description"
                value={form.description}
                placeholder="Ingredients, prep notes…"
                rows={3}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <Label className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={form.isVegan}
                onCheckedChange={(isVegan) => setForm((f) => ({ ...f, isVegan: isVegan === true }))}
              />
              Vegan
            </Label>

            <fieldset className="space-y-1.5">
              <legend className="mb-1.5 text-sm font-medium">Status</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {(Object.keys(STATUS_LABEL) as DishStatus[]).map((status) => (
                  <label
                    key={status}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg border bg-transparent px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors",
                      "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-1",
                      STATUS_RADIO_TONE[status],
                    )}
                  >
                    <input
                      type="radio"
                      name="dish-status"
                      value={status}
                      checked={form.status === status}
                      onChange={() => setForm((f) => ({ ...f, status }))}
                      className="sr-only"
                    />
                    <span className={cn("size-2 shrink-0 rounded-full", STATUS_DOT_TONE[status])} />
                    {STATUS_LABEL[status]}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <DialogFooter>
            {editing && (
              <Button
                variant="ghost"
                className="mr-auto"
                loading={isPending(`delete-${editing.id}`)}
                onClick={async () => {
                  const ok = await run(`delete-${editing.id}`, () => deleteDish(editing.id), "Failed to delete dish.");
                  if (ok) setOpen(false);
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={isPending("save-dish")} onClick={submit}>
              {editing ? "Save dish" : "Create dish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
