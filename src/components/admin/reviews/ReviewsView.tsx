"use client";

import { useMemo, useState } from "react";
import { Check, ShieldAlert, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type AdminReview } from "@/lib/api/admin";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { DataTable, type Column } from "@/components/admin/shared/DataTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { StatusPill } from "@/components/admin/shared/StatusPill";

const PAGE_SIZE = 20;
type ReviewView = "pending" | "approved" | "all";

function reviewVariant(review: AdminReview) {
  return review.isApproved ? "success" as const : "warning" as const;
}

function plainDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ReviewsView() {
  const [page, setPage] = useState(1);
  const [view, setView] = useState<ReviewView>("pending");
  const isApproved = view === "all" ? undefined : view === "approved";
  const { data, meta, isLoading, refetch } = useAdminData(() => adminApi.listReviews({ page, limit: PAGE_SIZE, isApproved }), { deps: [page, view] });
  const approve = useAdminMutation((id: string) => adminApi.approveReview(id));
  const reject = useAdminMutation((id: string) => adminApi.rejectReview(id));
  const remove = useAdminMutation((id: string) => adminApi.deleteReview(id));

  const reviews = useMemo(() => Array.isArray(data) ? data : [], [data]);
  const total = meta?.total ?? reviews.length;
  const totalPages = meta?.totalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function run(action: "approve" | "reject" | "delete", id: string) {
    const result = action === "approve" ? await approve.mutate(id) : action === "reject" ? await reject.mutate(id) : await remove.mutate(id);
    if (result !== null) {
      toast.success(action === "approve" ? "Review approved" : action === "reject" ? "Review kept hidden" : "Review deleted");
      refetch();
    } else {
      toast.error("Review action failed");
    }
  }

  const columns: Column<AdminReview>[] = [
    { key: "review", header: "Review", render: (review) => (
      <div className="max-w-xl">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{review.rating}/5</span>
          <StatusPill variant={reviewVariant(review)}>{review.isApproved ? "Published" : "Needs review"}</StatusPill>
        </div>
        <p className="mt-2 font-medium">{review.title || "Untitled review"}</p>
        <p className="mt-1 line-clamp-2 text-sm text-brand-textMuted">{review.comment || "No written comment."}</p>
      </div>
    ) },
    { key: "customer", header: "Customer", render: (review) => <span>{review.userName || "Anonymous"}</span> },
    { key: "date", header: "Date", render: (review) => <span className="text-sm text-brand-textMuted">{plainDate(review.createdAt)}</span> },
    { key: "actions", header: "Actions", render: (review) => (
      <div className="flex gap-1">
        <button type="button" aria-label="Approve review" className="flex h-10 w-10 items-center justify-center rounded-lg text-admin-success hover:bg-admin-success-light" onClick={() => run("approve", review.id)}><Check size={15} /></button>
        <button type="button" aria-label="Reject review" className="flex h-10 w-10 items-center justify-center rounded-lg text-admin-warning hover:bg-admin-warning-light" onClick={() => run("reject", review.id)}><X size={15} /></button>
        <button type="button" aria-label="Delete review" className="flex h-10 w-10 items-center justify-center rounded-lg text-admin-error hover:bg-admin-error-light" onClick={() => run("delete", review.id)}><Trash2 size={15} /></button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Reviews and Q&A</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Moderate product feedback before it affects trust</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-textMuted">Approve useful reviews, keep risky claims hidden, and watch for shade mismatch or irritation patterns.</p>
          </div>
          <div className="rounded-2xl bg-admin-warning-light p-4 text-sm text-admin-warning">
            <div className="flex gap-2 font-semibold"><ShieldAlert size={16} /> Pattern check</div>
            <p className="mt-1 text-xs leading-5">Repeated irritation, allergic reaction or shade mismatch comments should create a product-quality follow-up.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {(["pending", "approved", "all"] as ReviewView[]).map((item) => (
            <button key={item} type="button" onClick={() => { setView(item); setPage(1); }} className={`rounded-full px-4 py-2 text-sm font-semibold ${view === item ? "bg-brand-primary text-white" : "border border-brand-border text-brand-textMuted hover:text-brand-primary"}`}>{item === "pending" ? "Needs review" : item === "approved" ? "Published" : "All"}</button>
          ))}
        </div>
      </section>
      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <DataTable columns={columns} data={reviews} keyExtractor={(row) => row.id} caption="Product reviews" emptyMessage="No reviews in this view." isLoading={isLoading} minRowWidth="760px" />
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </section>
    </div>
  );
}
