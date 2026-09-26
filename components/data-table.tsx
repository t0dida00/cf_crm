"use client";

import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ErrorState, LoadingState } from "@/components/request-state";
import type { RequestStatus } from "@/lib/request-status";
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  table: TanstackTable<T>;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  minWidth?: number;
  /** Status of the request that feeds `table`. While loading with nothing to
   * show yet it renders a spinner, and on error a message with a retry;
   * rows already on screen stay (dimmed) during a refetch. */
  status?: RequestStatus;
  error?: string | null;
  onRetry?: () => void;
}

/** Thin presentational wrapper around a TanStack table instance. */
export function DataTable<T>({
  table,
  onRowClick,
  emptyMessage = "Nothing to show.",
  minWidth,
  status = "success",
  error,
  onRetry,
}: DataTableProps<T>) {
  const rows = table.getRowModel().rows;
  const colSpan = table.getAllColumns().length;
  const refetching = status === "loading" && rows.length > 0;
  return (
    <div className="overflow-x-auto">
      <Table style={minWidth ? { minWidth } : undefined}>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id} className="bg-secondary hover:bg-secondary">
              {group.headers.map((header) => (
                <TableHead
                  key={header.id}
                  style={{ width: header.getSize() === 150 ? undefined : header.getSize() }}
                  className="text-xs font-semibold tracking-wide text-muted-foreground uppercase first:pl-4 last:pr-4"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {status === "error" ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colSpan} className="p-0">
                <ErrorState message={error ?? undefined} onRetry={onRetry} />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 && (status === "loading" || status === "idle") ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colSpan} className="p-0">
                <LoadingState />
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={colSpan}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                // Clickable rows are keyboard-reachable too: Tab to focus, Enter/Space to open.
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        // Only when the row itself has focus, so buttons inside it keep working.
                        if (e.target !== e.currentTarget || (e.key !== "Enter" && e.key !== " ")) return;
                        e.preventDefault();
                        onRowClick(row.original);
                      }
                    : undefined
                }
                className={cn(
                  onRowClick &&
                    "cursor-pointer outline-none focus-visible:bg-secondary focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-inset",
                  refetching && "opacity-60",
                )}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-2.5 text-sm first:pl-4 last:pr-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
