"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { useWorkspace } from "@/components/providers/WorkspaceProvider";
import { SAVED_MESSAGE } from "@/hooks/useAsyncAction";
import { parseMenuCsv, planMenuImport, type MenuRow } from "@/lib/menuCsv";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * Previews a menu file before anything is saved: what it adds and updates, and
 * every error by line. Import runs only on an error-free file; it creates the
 * missing categories first, then saves the dishes one by one.
 */
/** A picked file: its text, or why it couldn't be read (e.g. not UTF-8). */
export type MenuFile = { name: string; text: string } | { name: string; error: string };

export function MenuImportDialog({ file, onClose }: { file: MenuFile | null; onClose: () => void }) {
  const { workspace, saveCategory, saveDish } = useWorkspace();
  const { categories, dishes, settings } = workspace;
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const parsed = useMemo(
    () =>
      !file
        ? null
        : "error" in file
          ? { rows: [], errors: [{ line: 0, message: file.error }] }
          : parseMenuCsv(file.text, settings.specialTaxes.map((t) => t.name)),
    [file, settings.specialTaxes],
  );
  const plan = useMemo(
    () => (parsed && !parsed.errors.length ? planMenuImport(parsed.rows, categories, dishes) : null),
    // Planned once per file: saving changes the menu mid-import.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [parsed],
  );

  const runImport = async () => {
    if (!plan) return;
    const total = plan.newCategories.length + plan.add.length + plan.update.length;
    let done = 0;
    setProgress({ done, total });
    const step = () => setProgress({ done: ++done, total });
    try {
      const catIds = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c.id]));
      for (const name of plan.newCategories) {
        const saved = await saveCategory({ name, valid: true });
        catIds.set(name.trim().toLowerCase(), saved.id);
        step();
      }
      const save = (row: MenuRow, id?: string) =>
        saveDish({
          id,
          name: row.name,
          price: row.price,
          catId: catIds.get(row.category.trim().toLowerCase())!,
          status: row.status,
          taxMode: row.taxMode,
          taxName: row.taxName,
          taxPct: row.taxPct,
          description: row.description,
          imageUrl: row.imageUrl,
          isVegan: row.isVegan,
        });
      for (const { id, row } of plan.update) {
        await save(row, id);
        step();
      }
      for (const row of plan.add) {
        await save(row);
        step();
      }
      toast.success(SAVED_MESSAGE);
      onClose();
    } catch (err) {
      const reason = err instanceof Error ? err.message : "The server didn't accept a change.";
      toast.error(`Import stopped after ${plural(done, "change")}: ${reason} Fix it and import the file again.`);
    } finally {
      setProgress(null);
    }
  };

  const busy = progress !== null;
  const errors = parsed?.errors ?? [];

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import menu</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{file?.name}</p>

        {errors.length > 0 ? (
          <div role="alert" className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <WarningCircle size={16} weight="bold" aria-hidden />
              {plural(errors.length, "problem")} to fix before importing. Nothing has been saved.
            </p>
            <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-3 text-sm">
              {errors.map((e, i) => (
                <li key={i}>
                  {e.line > 0 && <span className="font-semibold">Line {e.line}: </span>}
                  {e.message}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          plan && (
            <div className="space-y-3 text-sm">
              <ul className="space-y-1.5">
                <li>
                  <span className="font-semibold">{plural(plan.add.length, "dish", "dishes")}</span> to add
                </li>
                <li>
                  <span className="font-semibold">{plural(plan.update.length, "dish", "dishes")}</span> to update (matched by
                  category and name)
                </li>
                {plan.newCategories.length > 0 && (
                  <li>
                    <span className="font-semibold">{plural(plan.newCategories.length, "new category", "new categories")}</span>:{" "}
                    {plan.newCategories.join(", ")}
                  </li>
                )}
              </ul>
              <p className="text-muted-foreground">Dishes that aren&apos;t in the file stay as they are.</p>
            </div>
          )
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={runImport} disabled={!plan || busy} loading={busy}>
            {progress ? `Importing ${progress.done} of ${progress.total}…` : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
