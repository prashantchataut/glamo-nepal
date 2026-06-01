"use client";

import { useCallback, useState } from "react";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi, type AdminUserList } from "@/lib/api/admin";
import { DataTable, type Column } from "@/components/admin/shared/DataTable";
import { StatusPill } from "@/components/admin/shared/StatusPill";
import { Pagination } from "@/components/admin/shared/Pagination";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const PAGE_SIZE = 20;

const roleVariantMap: Record<string, "success" | "info" | "neutral"> = {
  ADMIN: "info",
  SUPER_ADMIN: "info",
  CUSTOMER: "neutral",
  STAFF: "success",
};

function roleLabel(role: string): string {
  switch (role.toUpperCase()) {
    case "ADMIN": return "Admin";
    case "SUPER_ADMIN": return "Super Admin";
    case "STAFF": return "Staff";
    default: return "Customer";
  }
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Users size={32} className="text-admin-error" />
      <p className="mt-3 text-sm text-brand-textMuted">{message}</p>
      <button onClick={onRetry} className="btn-press mt-4 inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white">
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

export function CustomersView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const fetchUsers = useCallback(
    () => adminApi.listUsers({ page, limit: PAGE_SIZE, search: search || undefined }),
    [page, search]
  );

  const { data, error, isLoading, isError, refetch } = useAdminData<AdminUserList>(fetchUsers);

  const statusMutation = useAdminMutation<{ message: string }, { id: string; isActive: boolean }>(
    useCallback(({ id, isActive }) => adminApi.updateUserStatus(id, isActive), [])
  );

  async function toggleStatus(user: { id: string; first_name?: string; last_name?: string; email: string; is_active: number }) {
    const newActive = user.is_active === 0;
    const result = await statusMutation.mutate({ id: user.id, isActive: newActive });
    if (result) {
      toast.success(`${user.first_name || user.email} is now ${newActive ? "active" : "inactive"}`);
      refetch();
    } else {
      toast.error(statusMutation.error || "Failed to update status");
    }
  }

  const columns: Column<AdminUserList["users"][number]>[] = [
    {
      key: "name",
      header: "Name",
      render: (row) => (
        <div>
          <p className="font-semibold text-brand-textPrimary">
            {[row.first_name, row.last_name].filter(Boolean).join(" ") || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (row) => <span className="text-sm">{row.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <StatusPill variant={roleVariantMap[row.role] || "neutral"}>
          {roleLabel(row.role)}
        </StatusPill>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <button
          onClick={() => toggleStatus(row)}
          disabled={statusMutation.isLoading}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold ring-1 transition",
            row.is_active
              ? "bg-admin-success-light text-admin-success ring-admin-success/20 hover:opacity-80"
              : "bg-admin-error-light text-admin-error ring-admin-error/20 hover:opacity-80"
          )}
        >
          {row.is_active ? "Active" : "Inactive"}
        </button>
      ),
    },
    {
      key: "orders",
      header: "Orders",
      render: (row) => <span className="text-sm">{row.orderCount ?? 0}</span>,
    },
    {
      key: "joined",
      header: "Joined",
      render: (row) => <span className="text-sm text-brand-textMuted">{row.created_at?.slice(0, 10)}</span>,
    },
  ];

  if (isError && !data) {
    return <ErrorState message={error || "Failed to load customers"} onRetry={refetch} />;
  }

  return (
    <section className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Customers</h2>
          <p className="mt-0.5 text-sm text-brand-textMuted">Manage user accounts, roles and status.</p>
        </div>
        <SearchInput onSearch={setSearch} placeholder="Search by name or email…" className="w-full sm:max-w-xs" />
      </div>

      <div className="mt-5">
        <DataTable
          columns={columns}
          data={data?.users ?? []}
          keyExtractor={(row) => row.id}
          caption="Customer list"
          isLoading={isLoading}
          emptyMessage="No customers found."
        />
      </div>

      {data && data.totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          total={data.total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </section>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}