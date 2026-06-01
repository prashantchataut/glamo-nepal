"use client";

import { type ReactNode } from "react";
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
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  caption,
  emptyMessage = "No data found.",
  isLoading = false,
  minRowWidth = "900px",
  selectedIds,
  onSelectionChange,
  onRowClick,
}: DataTableProps<T>) {
  const hasSelection = selectedIds !== undefined && onSelectionChange !== undefined;
  const allSelected = hasSelection && data.length > 0 && data.every((row) => selectedIds.has(keyExtractor(row)));
  const someSelected = hasSelection && data.some((row) => selectedIds.has(keyExtractor(row)));

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
            {hasSelection && (
              <th scope="col" className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={() => {
                    if (allSelected) {
                      onSelectionChange(new Set());
                    } else {
                      onSelectionChange(new Set(data.map(keyExtractor)));
                    }
                  }}
                  className="h-4 w-4 rounded border-brand-border accent-brand-primary"
                />
              </th>
            )}
            {columns.map((col) => (
              <th key={col.key} scope="col" className={cn("px-4 py-3", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const rowKey = keyExtractor(row);
            const isSelected = hasSelection && selectedIds.has(rowKey);
            return (
              <tr key={rowKey} className={cn("border-b border-brand-border/70 last:border-0", isSelected && "bg-brand-primary/5", onRowClick && "cursor-pointer hover:bg-brand-bgLight/60 transition-colors")} onClick={onRowClick ? () => onRowClick(row) : undefined}>
                {hasSelection && (
                  <td className="w-12 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                    const next = new Set(selectedIds);
                    if (isSelected) { next.delete(rowKey); } else { next.add(rowKey); }
                    onSelectionChange(next);
                  }}
                      className="h-4 w-4 rounded border-brand-border accent-brand-primary"
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-4", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
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