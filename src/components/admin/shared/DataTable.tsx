"use client";

import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  className?: string;
};

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  caption?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  minRowWidth?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  caption,
  emptyMessage = "No data found.",
  isLoading = false,
  minRowWidth = "900px",
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingSkeleton rows={5} />;
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-brand-textMuted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-6 px-6">
      <table className="w-full min-w-[var(--table-min-width)] text-sm" style={{ "--table-min-width": minRowWidth } as React.CSSProperties}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="font-label border-y border-brand-border bg-brand-bgLight text-left text-xs uppercase tracking-[0.14em] text-brand-textMuted">
            {columns.map((col) => (
              <th key={col.key} scope="col" className={cn("px-4 py-3", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={keyExtractor(row)} className="border-b border-brand-border/70 last:border-0">
              {columns.map((col) => (
                <td key={col.key} className={cn("px-4 py-4", col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl bg-brand-bgLight p-4">
          <div className="h-4 w-20 animate-pulse rounded bg-brand-border/50" />
          <div className="h-4 flex-1 animate-pulse rounded bg-brand-border/50" />
          <div className="h-4 w-16 animate-pulse rounded bg-brand-border/50" />
          <div className="h-4 w-24 animate-pulse rounded bg-brand-border/50" />
        </div>
      ))}
    </div>
  );
}