"use client";

import { useState } from "react";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi } from "@/lib/api/admin";
import { DataTable, type Column } from "@/components/admin/shared/DataTable";
import { StatusPill } from "@/components/admin/shared/StatusPill";
import { Pagination } from "@/components/admin/shared/Pagination";
import { SearchInput } from "@/components/admin/shared/SearchInput";
import { CustomerDetailModal } from "./CustomerDetailModal";
import { Users, RefreshCw, Eye } from "lucide-react";
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

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}

interface UserRow {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: string;
  is_active: number;
  orderCount?: number;
  created_at?: string;
}

export function CustomersView() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: usersData, meta: usersMeta, isLoading, isError } = useAdminData(() => adminApi.listUsers({ search: search || undefined, page, limit: PAGE_SIZE }), { deps: [search, page] });
  const { mutate: updateStatus } = useAdminMutation((vars: { userId: string; isActive: boolean }) => adminApi.updateUserStatus(vars.userId, vars.isActive));

  const users: UserRow[] = (() => {
    if (!usersData) return [];
    if (Array.isArray(usersData)) return usersData as unknown as UserRow[];
    return ((usersData as unknown as Record<string, unknown>).users ?? []) as unknown as UserRow[];
  })();

  const total = usersMeta?.total ?? (Array.isArray(usersData) ? usersData.length : (usersData as unknown as Record<string, unknown>).total as number ?? 0);
  const totalPages = usersMeta?.totalPages ?? (() => {
    if (!usersData) return 1;
    if (Array.isArray(usersData)) return Math.max(1, Math.ceil(usersData.length / PAGE_SIZE));
    return (usersData as unknown as Record<string, unknown>).totalPages as number ?? Math.max(1, Math.ceil(total / PAGE_SIZE));
  })();
  const error = isError ? "Failed to load customers" : null;

  async function toggleStatus(user: UserRow) {
    const newActive = user.is_active === 0;
    try {
      await updateStatus({ userId: user.id, isActive: newActive });
      toast.success(`${user.first_name || user.email} is now ${newActive ? "active" : "inactive"}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  const columns: Column<UserRow>[] = [
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
    {
      key: "actions",
      header: "",
      render: (row) => (
        <button
          onClick={() => setSelectedUserId(row.id)}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-brand-primary transition hover:bg-brand-primary/10"
        >
          <Eye size={14} /> View
        </button>
      ),
    },
  ];

  if (isError && !usersData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users size={32} className="text-admin-error" />
        <p className="mt-3 text-sm text-brand-textMuted">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-press mt-4 inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
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
          data={users}
          keyExtractor={(row) => row.id}
          caption="Customer list"
          isLoading={isLoading}
          emptyMessage="No customers found."
          onRowClick={(row) => setSelectedUserId(row.id)}
        />
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      <CustomerDetailModal
        open={!!selectedUserId}
        onOpenChange={(open) => { if (!open) setSelectedUserId(null); }}
        userId={selectedUserId}
      />
    </section>
  );
}