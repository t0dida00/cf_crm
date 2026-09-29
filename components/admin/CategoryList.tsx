"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { MotionConfig, Reorder, useDragControls } from "motion/react";
import { ArrowDown, ArrowUp, DotsSixVertical, EyeSlash, PencilSimple, Trash } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICON_BUTTON =
  "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

/**
 * The menu's categories in their order. Drag a row by its handle to move it
 * (Motion's Reorder: the others slide aside), or use Move up / Move down,
 * which also work from the keyboard. `onReorder` gets every id, first to last,
 * once a move is finished.
 */
export function CategoryList({
  categories,
  dishCount,
  onReorder,
  onEdit,
  onDelete,
  isDeleting,
}: {
  categories: Category[];
  dishCount: (id: string) => number;
  onReorder: (ids: string[]) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  isDeleting: (id: string) => boolean;
}) {
  const { t } = useTranslation();
  // The order on screen while dragging; the workspace's order the rest of the time.
  const [items, setItems] = useState(categories);
  const dragging = useRef(false);
  useEffect(() => {
    if (!dragging.current) setItems(categories);
  }, [categories]);

  const latest = useRef(items);
  latest.current = items;

  const commit = (next: Category[]) => {
    if (next.map((c) => c.id).join() !== categories.map((c) => c.id).join()) onReorder(next.map((c) => c.id));
  };

  const move = (index: number, by: -1 | 1) => {
    const next = [...items];
    [next[index], next[index + by]] = [next[index + by], next[index]];
    setItems(next);
    commit(next);
  };

  if (!categories.length) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{t("admin.categories.empty")}</p>;
  }

  return (
    <MotionConfig reducedMotion="user">
      <Reorder.Group axis="y" values={items} onReorder={setItems} className="divide-y" aria-label={t("admin.categories.listLabel")}>
        {items.map((category, index) => (
          <CategoryRow
            key={category.id}
            category={category}
            position={index + 1}
            count={items.length}
            dishes={dishCount(category.id)}
            onDragStart={() => (dragging.current = true)}
            onDragEnd={() => {
              dragging.current = false;
              commit(latest.current);
            }}
            onMove={(by) => move(index, by)}
            onEdit={() => onEdit(category)}
            onDelete={() => onDelete(category)}
            deleting={isDeleting(category.id)}
          />
        ))}
      </Reorder.Group>
    </MotionConfig>
  );
}

function CategoryRow({
  category,
  position,
  count,
  dishes,
  onDragStart,
  onDragEnd,
  onMove,
  onEdit,
  onDelete,
  deleting,
}: {
  category: Category;
  position: number;
  count: number;
  dishes: number;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (by: -1 | 1) => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { t } = useTranslation();
  // Only the handle starts a drag, so the row's buttons still click normally.
  const controls = useDragControls();
  const { name } = category;

  return (
    <Reorder.Item
      value={category}
      dragListener={false}
      dragControls={controls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.01, boxShadow: "0 12px 24px -12px rgb(35 47 63 / 0.35)" }}
      className="relative flex items-center gap-3 bg-card py-2.5 pr-4 pl-2"
    >
      <button
        type="button"
        onPointerDown={(e) => controls.start(e)}
        className={cn(ICON_BUTTON, "cursor-grab touch-none active:cursor-grabbing")}
        aria-label={t("admin.categories.drag", { name })}
      >
        <DotsSixVertical size={18} weight="bold" aria-hidden />
      </button>
      <span className="w-6 text-right text-sm text-muted-foreground tabular-nums" aria-hidden>
        {position}
      </span>
      <span className="min-w-0 flex-1 truncate font-semibold">{name}</span>
      <span className="hidden w-24 text-sm text-muted-foreground sm:block">
        {t("admin.categories.dishes", { count: dishes, n: dishes })}
      </span>
      <span className="hidden w-28 sm:block">
        {category.valid ? (
          <span className="text-sm text-muted-foreground">{t("admin.categories.onMenu")}</span>
        ) : (
          <Badge className="gap-1 bg-secondary text-muted-foreground">
            <EyeSlash size={12} weight="bold" aria-hidden />
            {t("admin.categories.hidden")}
          </Badge>
        )}
      </span>
      <span className="flex items-center">
        <button type="button" onClick={() => onMove(-1)} disabled={position === 1} className={ICON_BUTTON} aria-label={t("admin.categories.moveUp", { name })}>
          <ArrowUp size={15} weight="bold" aria-hidden />
        </button>
        <button type="button" onClick={() => onMove(1)} disabled={position === count} className={ICON_BUTTON} aria-label={t("admin.categories.moveDown", { name })}>
          <ArrowDown size={15} weight="bold" aria-hidden />
        </button>
        <button type="button" onClick={onEdit} className={ICON_BUTTON} aria-label={t("admin.categories.editName", { name })}>
          <PencilSimple size={15} weight="bold" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className={cn(ICON_BUTTON, "hover:text-destructive")}
          aria-label={t("admin.categories.deleteName", { name })}
        >
          <Trash size={15} weight="bold" aria-hidden />
        </button>
      </span>
    </Reorder.Item>
  );
}
