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
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  table: TanstackTable<T>;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  minWidth?: number;
}

/** Thin presentational wrapper around a TanStack table instance. */
export function DataTable<T>({
  table,
  onRowClick,
  emptyMessage = "Nothing to show.",
  minWidth,
}: DataTableProps<T>) {
  const rows = table.getRowModel().rows;
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
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
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
                className={cn(onRowClick && "cursor-pointer")}
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
