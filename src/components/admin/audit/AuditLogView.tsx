"use client";

import { useCallback, useState } from "react";
import { DataTable, type Column } from "@/components/admin/shared/DataTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { adminApi, type AuditLog } from "@/lib/api/admin";
import { useAdminData } from "@/lib/hooks/useAdminData";
import { RefreshCw } from "lucide-react";

const ENTITY_LABELS: Record<string, string> = {
  products: "Product",
  orders: "Order",
  banners: "Banner",
  users: "User",
  settings: "Settings",
  inventory: "Inventory",
  categories: "Category",
  brands: "Brand",
  reviews: "Review",
  coupons: "Coupon",
};

const PAGE_SIZE = 20;

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-brand-textMuted">{message}</p>
      <button onClick={onRetry} className="btn-press mt-4 inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white">
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

export function AuditLogView() {
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState("");

  const { data, error, isLoading, isError, refetch } = useAdminData(
    useCallback(
      () => adminApi.getAuditLogs({
        page,
        limit: PAGE_SIZE,
        entity: entityFilter || undefined,
      }),
      [page, entityFilter],
    ),
  );

  const logs = data?.logs ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const columns: Column<AuditLog>[] = [
    {
      key: "created_at",
      header: "Time",
      render: (log) => (
        <span className="text-xs text-brand-textMuted">
          {new Date(log.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (log) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
          log.action.toLowerCase().includes("create") ? "bg-admin-success-light text-admin-success" :
          log.action.toLowerCase().includes("delete") ? "bg-admin-error-light text-admin-error" :
          log.action.toLowerCase().includes("update") ? "bg-admin-info-light text-admin-info" :
          "bg-admin-neutral-light text-admin-neutral"
        }`}>
          {log.action}
        </span>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      render: (log) => (
        <div>
          <span className="text-sm font-medium">{ENTITY_LABELS[log.entity] ?? log.entity}</span>
          {log.entity_id && (
            <span className="ml-1 font-mono text-xs text-brand-textMuted">#{log.entity_id.slice(0, 8)}</span>
          )}
        </div>
      ),
    },
    {
      key: "changes",
      header: "Details",
      render: (log) => {
        if (!log.changes) return <span className="text-brand-textMuted">—</span>;
        try {
          const parsed = typeof log.changes === "string" ? JSON.parse(log.changes) : log.changes;
          const keys = Object.keys(parsed);
          if (keys.length === 0) return <span className="text-brand-textMuted">No changes</span>;
          return (
            <div className="max-w-[300px] truncate text-xs text-brand-textMuted">
              {keys.slice(0, 3).join(", ")}{keys.length > 3 ? ` +${keys.length - 3} more` : ""}
            </div>
          );
        } catch {
          return <span className="text-xs text-brand-textMuted">{String(log.changes).slice(0, 60)}</span>;
        }
      },
    },
    {
      key: "user_id",
      header: "User",
      render: (log) => (
        <span className="font-mono text-xs text-brand-textMuted">
          {log.user_id ? log.user_id.slice(0, 8) + "..." : "System"}
        </span>
      ),
    },
    {
      key: "ip",
      header: "IP",
      render: (log) => (
        <span className="font-mono text-xs text-brand-textMuted">{log.ip_address ?? "—"}</span>
      ),
    },
  ];

  if (isError && !data) {
    return (
      <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <ErrorState message={error || "Failed to load audit logs"} onRetry={refetch} />
      </div>
    );
  }

  return (
    <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Audit log</h2>
          <p className="mt-1 text-sm text-brand-textMuted">
            Track all changes made to products, orders, settings and more.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            aria-label="Filter by entity"
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-medium outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          >
            <option value="">All entities</option>
            {Object.entries(ENTITY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={logs}
          keyExtractor={(log) => log.id}
          caption="Audit log"
          isLoading={isLoading}
          emptyMessage={error ? `Error: ${error}` : "No audit logs found."}
          minRowWidth="800px"
        />
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}
    </section>
  );
}