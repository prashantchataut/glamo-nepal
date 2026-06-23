"use client";

import { useState } from "react";
import { DataTable, type Column } from "@/components/admin/shared/DataTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { useAdminData } from "@/lib/hooks/useAdminData";
import { adminApi, type AuditLog } from "@/lib/api/admin";

const ENTITY_LABELS: Record<string, string> = {
  products: "Product",
  orders: "Order",
  banners: "Banner",
  popups: "Popup",
  gallery: "Gallery item",
  users: "User",
  settings: "Settings",
  inventory: "Inventory",
  categories: "Category",
  brands: "Brand",
  reviews: "Review",
  coupons: "Coupon",
  team: "Team member",
  blogs: "Blog post",
};

const PAGE_SIZE = 20;

/**
 * Render a human-friendly actor label from an audit log's user_id.
 *
 * The backend auth middleware sets the acting user's id in one of three forms:
 *   - a real users.id UUID (the normal case)
 *   - "admin:<email>" (the legacy/super-admin bootstrap path in firebase-auth.ts
 *     when no users row exists yet)
 *   - null/undefined (a system / automated action)
 *
 * Returning the email handle directly for the "admin:" form is both safe and
 * the most useful thing to show the owner — it's who they logged in as.
 */
function describeActor(userId: string | null | undefined): { label: string; title?: string } {
  if (!userId) return { label: "System" };
  const id = String(userId);
  if (id.startsWith("admin:")) {
    const email = id.slice("admin:".length);
    return { label: email.split("@")[0], title: email };
  }
  // Short UUID preview; full id available in the title attribute.
  return { label: `${id.slice(0, 8)}…`, title: id };
}

/**
 * Parse the audit log `changes` column (TEXT, usually a JSON string) into a
 * readable list of changed-field names. Never throws — falls back to a trimmed
 * raw string if it isn't JSON.
 */
function summarizeChanges(raw: string | undefined | null): { keys: string[]; preview: string } {
  if (!raw) return { keys: [], preview: "" };
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const obj = parsed as Record<string, unknown>;
    const keys = Object.keys(obj);
    return { keys, preview: keys.join(", ") };
  } catch {
    return { keys: [], preview: String(raw).slice(0, 60) };
  }
}

export function AuditLogView() {
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState("");

  const { data: result, meta: resultMeta, isLoading, isError } = useAdminData(() => adminApi.getAuditLogs({
    page,
    limit: PAGE_SIZE,
    entity: entityFilter || undefined,
  }), { deps: [page, entityFilter] });

  // The paginated admin API returns { logs: [...] } inside `data`; the hook also
  // surfaces pagination via `meta`. Handle both shapes defensively.
  const logs = ((Array.isArray(result) ? result : (result as unknown as Record<string, unknown>)?.logs) ?? []) as unknown as AuditLog[];
  const total = resultMeta?.total ?? ((result as unknown as Record<string, unknown>)?.total as number ?? 0);
  const totalPages = resultMeta?.totalPages ?? ((result as unknown as Record<string, unknown>)?.totalPages as number ?? 1);
  const error = isError ? "Failed to load audit logs" : null;

  const columns: Column<AuditLog>[] = [
    {
      key: "created_at",
      header: "Time",
      render: (log) => {
        const ms = new Date(String(log.created_at)).getTime();
        const valid = Number.isFinite(ms);
        return (
          <span className="text-xs text-brand-textMuted">
            {valid ? new Date(ms).toLocaleString() : "—"}
          </span>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      render: (log) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
          log.action.toLowerCase().includes("create") ? "bg-admin-success-light text-admin-success" :
          log.action.toLowerCase().includes("delete") ? "bg-admin-error-light text-admin-error" :
          log.action.toLowerCase().includes("update") || log.action.toLowerCase().includes("role") || log.action.toLowerCase().includes("status") ? "bg-admin-info-light text-admin-info" :
          "bg-admin-neutral-light text-admin-neutral"
        }`}>
          {log.action}
        </span>
      ),
    },
    {
      key: "entity",
      header: "Item",
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
        const { keys, preview } = summarizeChanges(log.changes);
        if (keys.length === 0 && !preview) return <span className="text-brand-textMuted">—</span>;
        if (keys.length === 0) return <span className="text-xs text-brand-textMuted">{preview}</span>;
        return (
          <div className="max-w-[300px] truncate text-xs text-brand-textMuted" title={keys.join(", ")}>
            {keys.slice(0, 3).join(", ")}{keys.length > 3 ? ` +${keys.length - 3} more` : ""}
          </div>
        );
      },
    },
    {
      key: "user_id",
      header: "By",
      render: (log) => {
        const actor = describeActor(log.user_id);
        return (
          <span className="text-xs text-brand-textMuted" title={actor.title}>
            {actor.label}
          </span>
        );
      },
    },
    {
      key: "ip_address",
      header: "IP",
      render: (log) => (
        <span className="font-mono text-xs text-brand-textMuted">{log.ip_address ?? "—"}</span>
      ),
    },
  ];

  if (isError && !result) {
    return (
      <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-brand-textMuted">{error}</p>
        </div>
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
            aria-label="Filter by type"
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-medium outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
          >
            <option value="">All types</option>
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
          emptyMessage={error ? `Error: ${error}` : "No activity recorded yet. Changes you make (create, update, delete) will show up here."}
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
