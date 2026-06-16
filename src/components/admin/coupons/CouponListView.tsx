"use client";

import { useCallback, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusPill } from "@/components/admin/shared/StatusPill";
import { DataTable, type Column } from "@/components/admin/shared/DataTable";
import { Pagination } from "@/components/admin/shared/Pagination";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi, type AdminCoupon } from "@/lib/api/admin";
import { CouponForm } from "@/components/admin/coupons/CouponForm";

const PAGE_SIZE = 20;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function CouponsView() {
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<AdminCoupon | null>(null);
const { data: couponsData, meta: couponsMeta, isLoading, refetch } = useAdminData(() =>
    adminApi.listCoupons({ page, limit: PAGE_SIZE })
  );

  const { mutate: deleteCouponMut } = useAdminMutation((id: string) =>

    adminApi.deleteCoupon(id)
  );

  const coupons: AdminCoupon[] = useMemo(() => {
    if (!couponsData) return [];
    const raw = (couponsData as unknown as Record<string, unknown>).coupons ?? couponsData;
    return Array.isArray(raw) ? raw : [];
  }, [couponsData]);

  const total: number = couponsMeta?.total ?? (couponsData ? (couponsData as unknown as Record<string, unknown>).total as number ?? coupons.length : coupons.length);

  const totalPages = couponsMeta?.totalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleDelete = useCallback(async () => {
    if (!deleteId) return;
    try {
      await deleteCouponMut(deleteId);
      toast.success("Coupon deleted");
      refetch();
    } catch {
      toast.error("Failed to delete coupon");
    } finally {
      setDeleteId(null);
    }
  }, [deleteId, deleteCouponMut, refetch]);

  const columns: Column<AdminCoupon>[] = [
    {
      key: "code",
      header: "Code",
      render: (c) => (
        <span className="font-mono text-sm font-semibold">{c.code}</span>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (c) => (
        <span className="capitalize text-sm">{c.type === "PERCENTAGE" ? "Percentage" : "Fixed"}</span>
      ),
    },
    {
      key: "value",
      header: "Value",
      render: (c) => (
        <span className="font-semibold">
          {c.type === "PERCENTAGE" ? `${c.value}%` : `NPR ${c.value}`}
        </span>
      ),
    },
    {
      key: "minOrder",
      header: "Min order",
      render: (c) => (
        <span>{c.minOrderAmount ? `NPR ${c.minOrderAmount}` : "—"}</span>
      ),
    },
    {
      key: "usage",
      header: "Usage",
      render: (c) => (
        <span className="text-sm">
          {c.usageCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) => (
        <StatusPill variant={c.isActive ? "success" : "neutral"}>
          {c.isActive ? "Active" : "Inactive"}
        </StatusPill>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      render: (c) => (
        <div className="text-xs text-brand-textMuted">
          <div>{formatDate(c.startsAt)}</div>
          <div>{formatDate(c.expiresAt)}</div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (c) => (
        <div className="flex gap-1">
          <button
            aria-label="Edit coupon"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-brand-textMuted hover:bg-brand-bgLight"
            onClick={() => {
              setEditCoupon(c);
              setFormOpen(true);
            }}
          >
            <Pencil size={15} />
          </button>
          <button
            aria-label="Delete coupon"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-admin-error hover:bg-admin-error-light"
            onClick={() => setDeleteId(c.id)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">Coupons</h2>
            <p className="mt-1 text-sm text-brand-textMuted">
              Manage discount codes and promotional coupons.
            </p>
          </div>
          <button
            onClick={() => {
              setEditCoupon(null);
              setFormOpen(true);
            }}
            className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white"
          >
            <Plus size={15} /> New coupon
          </button>
        </div>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={coupons}
            keyExtractor={(c) => c.id}
            caption="Coupons"
            isLoading={isLoading}
            emptyMessage="No coupons found."
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

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Delete coupon"
        description="This action cannot be undone. The coupon will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        isLoading={false}
        onConfirm={handleDelete}
      />

      <CouponForm
        open={formOpen}
        onOpenChange={setFormOpen}
        coupon={editCoupon}
        onSaved={refetch}
      />
    </>
  );
}