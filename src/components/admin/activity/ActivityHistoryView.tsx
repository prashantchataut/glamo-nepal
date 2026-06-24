"use client";

import Link from "next/link";
import { Clock3, Download, History, ShieldCheck } from "lucide-react";
import { adminApi, type AdminActivityItem } from "@/lib/api/admin";
import { useAdminData } from "@/lib/hooks/useAdminData";

function humanAction(item: AdminActivityItem): string {
  const action = item.action.replace(/_/g, " ").toLowerCase();
  const entity = item.entity.replace(/_/g, " ");
  return `${item.actor} ${action} ${entity}${item.entityId ? ` (${item.entityId.slice(0, 8)})` : ""}`;
}

function changeSummary(changes: unknown): string {
  if (!changes) return "No detailed change payload was recorded.";
  if (typeof changes === "string") return changes;
  if (Array.isArray(changes)) return `${changes.length} changed item${changes.length === 1 ? "" : "s"}`;
  if (typeof changes === "object") {
    const keys = Object.keys(changes as Record<string, unknown>).slice(0, 5);
    return keys.length ? `Changed: ${keys.join(", ")}` : "Change details recorded.";
  }
  return String(changes);
}

async function downloadActivity() {
  const blob = await adminApi.downloadExport("activity");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "glamo-activity.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function ActivityHistoryView() {
  const { data: activity, isLoading, isError, refetch } = useAdminData(() => adminApi.getActivityFeed(100));
  const items = activity ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Activity history</p>
            <h2 className="mt-2 font-display text-3xl font-semibold">See who changed what.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-textMuted">For non-technical owners, this is the undo investigation page: price changes, deleted banners, stock edits, settings updates and staff actions.</p>
          </div>
          <button onClick={downloadActivity} className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-3 text-sm font-bold text-white">
            <Download size={15} /> Export activity
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-brand-bgLight" />)}
          </div>
        ) : isError ? (
          <div className="py-16 text-center">
            <p className="text-sm text-brand-textMuted">Could not load activity history.</p>
            <button onClick={refetch} className="mt-4 rounded-full bg-brand-primary px-4 py-2 text-sm font-bold text-white">Retry</button>
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-[1.25rem] border border-brand-border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <div className="mt-0.5 rounded-xl bg-brand-primary-light p-2 text-brand-primary"><History size={16} /></div>
                    <div>
                      <p className="font-semibold text-brand-textPrimary">{humanAction(item)}</p>
                      <p className="mt-1 text-sm leading-5 text-brand-textMuted">{changeSummary(item.changes)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-brand-textMuted"><Clock3 size={13} /> {new Date(item.createdAt).toLocaleString()}</div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <ShieldCheck className="mx-auto text-brand-primary" size={28} />
            <p className="mt-3 font-semibold">No activity recorded yet.</p>
            <p className="mt-1 text-sm text-brand-textMuted">Actions will appear here as admins update products, content and settings.</p>
          </div>
        )}
      </section>

      <section className="rounded-[1.5rem] border border-brand-border bg-brand-bgLight p-5">
        <p className="text-sm text-brand-textMuted">Need the stricter audit log with filters? <Link href="/admin/audit" className="font-semibold text-brand-primary">Open Audit Log</Link>.</p>
      </section>
    </div>
  );
}
