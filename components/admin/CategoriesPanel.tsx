"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
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
import { FieldError, fieldErrorProps } from "@/components/common/FieldError";
import { RequiredLabel } from "@/components/common/RequiredLabel";
import { validateCategory, type FieldErrors, withFieldError } from "@/lib/validation";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { SAVED_MESSAGE, useAsyncAction } from "@/hooks/useAsyncAction";
import type { Category } from "@/lib/types";
import { CategoryList } from "./CategoryList";

export function CategoriesPanel({ createSignal }: { createSignal: number }) {
  const { workspace, saveCategory, deleteCategory, reorderCategories } = useWorkspace();
  const { run, isPending } = useAsyncAction();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", valid: true });
  const [errors, setErrors] = useState<FieldErrors<"name">>({});

  useEffect(() => {
    if (createSignal > 0) {
      setEditing(null);
      setErrors({});
      setForm({ name: "", valid: true });
      setOpen(true);
    }
  }, [createSignal]);

  const startEdit = (category: Category) => {
    setEditing(category);
    setErrors({});
    setForm({ name: category.name, valid: category.valid });
    setOpen(true);
  };

  const dishCount = (id: string) => workspace.dishes.filter((d) => d.catId === id).length;

  const submit = async () => {
    const found = validateCategory(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    const ok = await run("save-category", () =>
      saveCategory({ id: editing?.id, name: form.name.trim(), valid: form.valid }), undefined, SAVED_MESSAGE
    );
    if (ok) setOpen(false);
  };

  return (
    <>
      <Card className="overflow-hidden py-0">
        <CategoryList
          categories={workspace.categories}
          dishCount={dishCount}
          onReorder={(ids) => run("reorder-categories", () => reorderCategories(ids), "Couldn't save the new order.", SAVED_MESSAGE)}
          onEdit={startEdit}
          onDelete={(category) =>
            run(`delete-${category.id}`, () => deleteCategory(category.id), "Failed to delete category.")
          }
          isDeleting={(id) => isPending(`delete-${id}`)}
        />
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <RequiredLabel htmlFor="category-name">Name</RequiredLabel>
              <Input
                id="category-name"
                required
                value={form.name}
                placeholder="e.g. Drinks"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                {...fieldErrorProps("category-name", errors.name)}
                onBlur={() => setErrors((e) => withFieldError(e, "name", validateCategory(form).name))}
              />
              <FieldError id="category-name" message={errors.name} />
            </div>
            <Label className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={form.valid}
                onCheckedChange={(valid) => setForm((f) => ({ ...f, valid: valid === true }))}
              />
              Show on the menu
            </Label>
          </div>
          <DialogFooter>
            {editing && (
              <Button
                variant="ghost"
                className="mr-auto"
                loading={isPending(`delete-${editing.id}`)}
                onClick={async () => {
                  const ok = await run(
                    `delete-${editing.id}`,
                    () => deleteCategory(editing.id),
                    "Failed to delete category.",
                  );
                  if (ok) setOpen(false);
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button loading={isPending("save-category")} onClick={submit}>
              {editing ? "Save category" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
