"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { DataTable } from "@/components/data-table";
import { useWorkspace } from "@/components/workspace-provider";
import type { Category } from "@/lib/types";

interface Row {
  category: Category;
  dishes: number;
}

const helper = createColumnHelper<Row>();

export function CategoriesPanel({ createSignal }: { createSignal: number }) {
  const { workspace, saveCategory, deleteCategory } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", valid: true });

  useEffect(() => {
    if (createSignal > 0) {
      setEditing(null);
      setForm({ name: "", valid: true });
      setOpen(true);
    }
  }, [createSignal]);

  const startEdit = (category: Category) => {
    setEditing(category);
    setForm({ name: category.name, valid: category.valid });
    setOpen(true);
  };

  const rows = useMemo<Row[]>(
    () =>
      workspace.categories.map((category) => ({
        category,
        dishes: workspace.dishes.filter((d) => d.catId === category.id).length,
      })),
    [workspace.categories, workspace.dishes],
  );

  const table = useReactTable({
    data: rows,
    columns: useMemo(
      () => [
        helper.accessor((r) => r.category.name, {
          id: "name",
          header: "Name",
          cell: (c) => <span className="font-semibold">{c.getValue()}</span>,
        }),
        helper.accessor("dishes", {
          header: "Dishes",
          cell: (c) => (
            <span className="text-muted-foreground">
              {c.getValue()} {c.getValue() === 1 ? "dish" : "dishes"}
            </span>
          ),
          size: 120,
        }),
        helper.accessor((r) => r.category.valid, {
          id: "valid",
          header: "Status",
          cell: (c) => (
            <Badge
              className={
                c.getValue() ? "bg-green-50 text-green-700" : "bg-secondary text-muted-foreground"
              }
            >
              {c.getValue() ? "Valid" : "Hidden"}
            </Badge>
          ),
          size: 110,
        }),
        helper.display({
          id: "actions",
          header: "",
          size: 90,
          cell: ({ row }) => (
            <span className="flex justify-end gap-3.5">
              <button
                type="button"
                onClick={() => startEdit(row.original.category)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Edit category"
              >
                <PencilSimple size={15} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => deleteCategory(row.original.category.id)}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Delete category"
              >
                <Trash size={15} weight="bold" />
              </button>
            </span>
          ),
        }),
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [deleteCategory],
    ),
    getCoreRowModel: getCoreRowModel(),
  });

  const submit = () => {
    if (!form.name.trim()) return;
    saveCategory({ id: editing?.id, name: form.name.trim(), valid: form.valid });
    setOpen(false);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="px-0">
          <DataTable table={table} emptyMessage="No categories yet." />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={form.name}
                placeholder="e.g. Drinks"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <Label className="flex items-center gap-2 font-normal">
              <Checkbox
                checked={form.valid}
                onCheckedChange={(valid) => setForm((f) => ({ ...f, valid: valid === true }))}
              />
              Valid — show on the menu
            </Label>
          </div>
          <DialogFooter>
            {editing && (
              <Button
                variant="ghost"
                className="mr-auto"
                onClick={() => {
                  deleteCategory(editing.id);
                  setOpen(false);
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>
              {editing ? "Save category" : "Create category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
