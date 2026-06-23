"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { adminApi, type AdminUserDetail } from "@/lib/api/admin";
import { useAdminData, useAdminMutation } from "@/lib/hooks/useAdminData";
import { useAdminStore } from "@/store/useAdminStore";
import { formatNPR } from "@/lib/utils";
import { StatusPill, orderStatusToVariant } from "@/components/admin/shared/StatusPill";
import { Mail, Phone, Calendar, ShoppingBag, DollarSign, Clock, RefreshCw } from "lucide-react";

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center py-8 text-center">
      <p className="text-sm text-brand-textMuted">{message}</p>
      <button onClick={onRetry} className="btn-press mt-3 inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white">
        <RefreshCw size={14} /> Retry
      </button>
    </div>
  );
}

interface CustomerDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

// The selectable staff/admin roles. OWNER is deliberately NOT offered here:
// there must be exactly one owner (bootstrap from SUPER_ADMIN_EMAILS) and
// letting an owner promote someone else to OWNER through this UI risks a
// lockout or a privilege escalation we can't undo from the panel.
const ROLE_OPTIONS = [
  {
    value: "CUSTOMER",
    label: "Customer",
    description: "Can shop and place orders. No admin access.",
  },
  {
    value: "STAFF",
    label: "Staff",
    description: "Can manage orders and inventory. Cannot change settings, roles, coupons or marketing.",
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "Full access to products, orders, marketing, banners, popups and analytics. Cannot manage other admins' roles.",
  },
] as const;

export function CustomerDetailModal({ open, onOpenChange, userId }: CustomerDetailModalProps) {
  const fetchUser = useCallback(() => {
    if (!userId) return Promise.reject(new Error("No user ID"));
    return adminApi.getUser(userId);
  }, [userId]);

  const { data: user, error, isLoading, isError, refetch } = useAdminData<AdminUserDetail>(
    fetchUser,
    { enabled: open && !!userId, deps: [userId] }
  );

  const currentAdmin = useAdminStore((s) => s.adminUser);
  const isOwner = (currentAdmin?.role ?? "").toUpperCase() === "OWNER";

  // Role-change state. The selected role mirrors the loaded user's role until
  // the admin picks a different one.
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const { mutate: updateRole, isLoading: isSavingRole } = useAdminMutation(
    (vars: { id: string; role: string }) => adminApi.updateUserRole(vars.id, vars.role)
  );

  const effectiveRole = user?.role ?? "";
  const selectedRole = pendingRole ?? effectiveRole;
  const roleChanged = pendingRole !== null && pendingRole !== effectiveRole;

  async function handleSaveRole() {
    if (!user || !pendingRole) return;
    try {
      await updateRole({ id: user.id, role: pendingRole });
      toast.success(`Role updated to ${ROLE_OPTIONS.find((r) => r.value === pendingRole)?.label ?? pendingRole}`);
      setPendingRole(null);
      refetch();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  const fullName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Customer Details</DialogTitle>
          <DialogDescription>
            {user ? fullName : "Loading customer information…"}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-brand-border/30" />
            ))}
          </div>
        )}

        {isError && !user && (
          <ErrorBlock message={error || "Failed to load customer details"} onRetry={refetch} />
        )}

        {user && (
          <div className="space-y-6 pt-2">
            {/* Profile Card */}
            <div className="rounded-2xl border border-brand-border bg-brand-bgLight/50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  <span className="text-xl font-bold">
                    {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg font-semibold text-brand-textPrimary">{fullName}</h3>
                  <div className="mt-1 space-y-1">
                    <span className="flex items-center gap-2 text-sm text-brand-textMuted">
                      <Mail size={14} /> {user.email}
                    </span>
                    {user.phone && (
                      <span className="flex items-center gap-2 text-sm text-brand-textMuted">
                        <Phone size={14} /> {user.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-2 text-sm text-brand-textMuted">
                      <Calendar size={14} /> Joined {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusPill variant={user.role === "CUSTOMER" ? "neutral" : "info"}>
                      {user.role}
                    </StatusPill>
                    <StatusPill variant={user.is_active ? "success" : "error"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </StatusPill>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-brand-textMuted">
                  <ShoppingBag size={16} />
                  <span className="text-xs font-medium uppercase tracking-wide">Total Orders</span>
                </div>
                <p className="mt-1 font-display text-2xl font-semibold text-brand-textPrimary">
                  {user.orderCount ?? user.recentOrders?.length ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-brand-border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-brand-textMuted">
                  <DollarSign size={16} />
                  <span className="text-xs font-medium uppercase tracking-wide">Total Spent</span>
                </div>
                <p className="mt-1 font-display text-2xl font-semibold text-brand-textPrimary">
                  {formatNPR(user.totalSpent ?? 0)}
                </p>
              </div>
            </div>

            {/* Role & access — only an Owner can change roles (backend gates
                PATCH /users/:id/role on OWNER). Staff/Admin see read-only. */}
            <div>
              <h4 className="font-display text-base font-semibold text-brand-textPrimary">
                Role &amp; access
              </h4>
              {isOwner ? (
                <div className="mt-3 space-y-2">
                  {ROLE_OPTIONS.map((opt) => {
                    const checked = selectedRole === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
                          checked
                            ? "border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary/20"
                            : "border-brand-border bg-white hover:bg-brand-bgLight/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="user-role"
                          value={opt.value}
                          checked={checked}
                          onChange={() => setPendingRole(opt.value)}
                          className="mt-1 h-4 w-4 accent-brand-primary"
                        />
                        <div>
                          <p className="text-sm font-semibold text-brand-textPrimary">{opt.label}</p>
                          <p className="text-xs text-brand-textMuted">{opt.description}</p>
                        </div>
                      </label>
                    );
                  })}
                  {roleChanged && (
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={handleSaveRole}
                        disabled={isSavingRole}
                        className="inline-flex items-center justify-center rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:opacity-60"
                      >
                        {isSavingRole ? "Saving…" : "Save role"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingRole(null)}
                        disabled={isSavingRole}
                        className="rounded-full px-4 py-2 text-sm font-medium text-brand-textMuted hover:bg-brand-bgLight"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {effectiveRole === "OWNER" && (
                    <p className="text-xs text-amber-700">
                      This is the store owner. Owner role is set by the SUPER_ADMIN_EMAILS env
                      variable and can't be changed here.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-sm text-brand-textMuted">
                  Only the store owner can change roles. Current role:{" "}
                  <span className="font-semibold text-brand-textPrimary">{effectiveRole}</span>.
                </p>
              )}
            </div>

            {/* Recent Orders */}
            <div>
              <h4 className="font-display text-base font-semibold text-brand-textPrimary">
                Recent Orders
              </h4>
              {user.recentOrders && user.recentOrders.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {user.recentOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between rounded-xl border border-brand-border bg-white px-4 py-3 shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-brand-textPrimary">
                          #{order.order_number}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-brand-textMuted">
                          <Clock size={12} />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusPill variant={orderStatusToVariant(order.status)}>
                          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                        </StatusPill>
                        <span className="text-sm font-semibold text-brand-textPrimary">
                          {formatNPR(order.total_amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-brand-textMuted">No orders yet.</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}