"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { formatNumber as fmt } from "@/lib/format";

/** "Showing 21–40 of 1,000 orders" with previous/next buttons, for lists paged
 * by the server (`page` is 1-based). */
export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  noun = "orders",
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  noun?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <span className="text-[13px] text-muted-foreground">
        {total
          ? `Showing ${fmt((page - 1) * pageSize + 1)}–${fmt(Math.min(page * pageSize, total))} of ${fmt(total)} ${noun}`
          : `No ${noun}`}
      </span>
      <span className="flex items-center gap-2">
        <span className="text-[13px] text-muted-foreground">
          Page {fmt(page)} of {fmt(pageCount)}
        </span>
        <Button
          variant="outline"
          size="icon"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <CaretLeft size={14} weight="bold" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <CaretRight size={14} weight="bold" />
        </Button>
      </span>
    </div>
  );
}
