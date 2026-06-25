"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Globe2, Search, ShieldCheck } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/shared/DataTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { useAdminData } from "@/lib/hooks/useAdminData";
import { adminApi } from "@/lib/api/admin";

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  entity: string;
  entity_id?: string;
  changes?: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
}

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

export function AuditLogView() {
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState("");
  const [ipQuery, setIpQuery] = useState("");

  const {
    data: result,
    meta: resultMeta,
    isLoading,
    isError,
  } = useAdminData(
    () =>
      adminApi.getAuditLogs({
        page,
        limit: PAGE_SIZE,
        entity: entityFilter || undefined,
      }),
    { deps: [page, entityFilter] },
  );

  const rawLogs = (Array.isArray(result)
    ? result
    : ((result as unknown as Record<string, unknown>)?.logs ??
      [])) as unknown as AuditLog[];

  // IP search is performed client-side over the current page so admins can
  // quickly answer "who from this IP just changed something?".
  const logs = useMemo(() => {
    const needle = ipQuery.trim().toLowerCase();
    if (!needle) return rawLogs;
    return rawLogs.filter((log) => (log.ip_address ?? "").toLowerCase().includes(needle));
  }, [rawLogs, ipQuery]);

  const total =
    resultMeta?.total ??
    ((result as unknown as Record<string, unknown>)?.total as number) ??
    0;
  const totalPages =
    resultMeta?.totalPages ??
    ((result as unknown as Record<string, unknown>)?.totalPages as number) ??
    1;

  // Lightweight stats — cheap to compute from the current page and useful at
  // a glance. The full count is already in `total`.
  const uniqueIps = useMemo(() => {
    const set = new Set<string>();
    for (const log of rawLogs) {
      if (log.ip_address) set.add(log.ip_address);
    }
    return set.size;
  }, [rawLogs]);

  const error = isError ? "Failed to load audit logs" : null;

  function actionVariant(action: string): { label: string; className: string } {
    const lower = action.toLowerCase();
    if (lower.includes("create") || lower.includes("add")) {
      return { label: action, className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
    if (lower.includes("delete") || lower.includes("remove")) {
      return { label: action, className: "bg-rose-50 text-rose-700 border-rose-200" };
    }
    if (lower.includes("update") || lower.includes("toggle")) {
      return { label: action, className: "bg-sky-50 text-sky-700 border-sky-200" };
    }
    if (lower.includes("bulk")) {
      return { label: action, className: "bg-amber-50 text-amber-800 border-amber-200" };
    }
    return { label: action, className: "bg-neutral-100 text-neutral-700 border-neutral-200" };
  }

  const columns: Column<AuditLog>[] = [
    {
      key: "created_at",
      header: "When",
      render: (log) => (
        <span className="text-xs leading-5 text-neutral-600">
          {new Date(log.created_at.replace(" ", "T")).toLocaleString()}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (log) => {
        const variant = actionVariant(log.action);
        return (
          <span
            data-testid="audit-action"
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold ${variant.className}`}
          >
            {variant.label}
          </span>
        );
      },
    },
    {
      key: "entity",
      header: "What",
      render: (log) => (
        <div>
          <div className="text-sm font-medium text-neutral-900">
            {ENTITY_LABELS[log.entity] ?? log.entity}
          </div>
          {log.entity_id ? (
            <span className="font-mono text-[11px] text-neutral-500">#{log.entity_id.slice(0, 8)}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: "changes",
      header: "Details",
      render: (log) => {
        if (!log.changes) return <span className="text-neutral-400">—</span>;
        try {
          const parsed =
            typeof log.changes === "string"
              ? JSON.parse(log.changes)
              : log.changes;
          const keys = Object.keys(
            parsed as unknown as Record<string, unknown>,
          );
          if (keys.length === 0) {
            return <span className="text-neutral-400">No changes</span>;
          }
          return (
            <div className="max-w-[300px] truncate text-xs text-neutral-600">
              {keys.slice(0, 3).join(", ")}
              {keys.length > 3 ? ` +${keys.length - 3} more` : ""}
            </div>
          );
        } catch {
          return (
            <span className="text-xs text-neutral-500">
              {String(log.changes).slice(0, 60)}
            </span>
          );
        }
      },
    },
    {
      key: "user_id",
      header: "Who",
      render: (log) => (
        <span className="font-mono text-xs text-neutral-500">
          {log.user_id ? `${log.user_id.slice(0, 8)}…` : "System"}
        </span>
      ),
    },
    {
      key: "ip_address",
      header: "From",
      render: (log) => {
        if (!log.ip_address) {
          return (
            <span className="font-mono text-xs text-neutral-400" title="No IP captured (older entries)">
              —
            </span>
          );
        }
        return (
          <span
            data-testid="audit-ip"
            title={log.user_agent ? log.user_agent : "IP address"}
            className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 font-mono text-[11px] text-neutral-700"
          >
            <Globe2 size={11} className="text-neutral-400" aria-hidden="true" />
            {log.ip_address}
          </span>
        );
      },
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
    <section className="space-y-4">
      <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Audit log</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Who changed what, when, from where.</h2>
            <p className="mt-1 max-w-2xl text-sm text-brand-textMuted">
              Every write to products, orders, settings, coupons and more is captured with action, payload diff, actor and origin IP. Search by IP to investigate a single client.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                <ClipboardList size={13} aria-hidden="true" />
                Events on page
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-900">{rawLogs.length}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                <ShieldCheck size={13} aria-hidden="true" />
                Unique IPs
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-900">{uniqueIps}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">Total in window</div>
              <p className="mt-1 text-xl font-semibold tabular-nums text-neutral-900">{total}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search by IP address</span>
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={ipQuery}
              onChange={(event) => setIpQuery(event.target.value)}
              placeholder="Filter this page by IP address (e.g. 110.44.x.x)"
              aria-label="Filter audit log by IP address"
              className="w-full rounded-full border border-brand-border bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-neutral-500">
            <span className="sr-only">Filter by entity</span>
            <select
              aria-label="Filter audit log by entity"
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-full border border-brand-border bg-white px-4 py-2 text-sm font-medium outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            >
              <option value="">All entities</option>
              {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <DataTable
          columns={columns}
          data={logs}
          keyExtractor={(log) => log.id}
          caption="Audit log"
          isLoading={isLoading}
          emptyMessage={
            error
              ? `Error: ${error}`
              : ipQuery
                ? `No entries from an IP matching "${ipQuery}" on this page.`
                : "No audit logs found."
          }
          minRowWidth="900px"
        />

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
      </div>
    </section>
  );
}
