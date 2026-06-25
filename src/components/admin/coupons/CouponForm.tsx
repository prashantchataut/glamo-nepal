"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminMutation } from "@/lib/hooks/useAdminData";
import { adminApi, type AdminCoupon, type CreateCouponInput, type UpdateCouponInput } from "@/lib/api/admin";

interface CouponFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: AdminCoupon | null;
  onSaved: () => void;
}

interface CouponFormData {
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: string;
  perUserLimit: string;
  startsAt: string;
  expiresAt: string;
  is_active: boolean;
}

const defaultFormData: CouponFormData = {
  code: "",
  type: "PERCENTAGE",
  value: "",
  minOrderAmount: "",
  maxDiscount: "",
  usageLimit: "",
  perUserLimit: "",
  startsAt: "",
  expiresAt: "",
  is_active: true,
};

function toDateString(dateStr: string): string {
  try {
    return new Date(dateStr).toISOString().slice(0, 16);
  } catch {
    return dateStr;
  }
}

export function CouponForm({ open, onOpenChange, coupon, onSaved }: CouponFormProps) {
  const isEditing = !!coupon;

  const [formData, setFormData] = useState<CouponFormData>(() =>
    coupon
      ? {
          code: coupon.code,
          type: coupon.type,
          value: String(coupon.value),
          minOrderAmount: coupon.minOrderAmount ? String(coupon.minOrderAmount) : "",
          maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
          usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
          perUserLimit: coupon.perUserLimit ? String(coupon.perUserLimit) : "",
          startsAt: toDateString(coupon.startsAt),
          expiresAt: toDateString(coupon.expiresAt),
          is_active: coupon.isActive,
        }
      : defaultFormData
  );
  const [isSaving, setIsSaving] = useState(false);

  const { mutate: createCouponMut } = useAdminMutation((data: CreateCouponInput) =>
    adminApi.createCoupon(data)
  );
  const { mutate: updateCouponMut } = useAdminMutation(
    ({ id, data }: { id: string; data: UpdateCouponInput }) =>
      adminApi.updateCoupon(id, data)
  );

  const handleSave = useCallback(async () => {
    if (!formData.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    if (!formData.value || Number(formData.value) <= 0) {
      toast.error("Value must be greater than 0");
      return;
    }
    if (!formData.startsAt || !formData.expiresAt) {
      toast.error("Start and end dates are required");
      return;
    }
    if (new Date(formData.expiresAt) <= new Date(formData.startsAt)) {
      toast.error("Expiry date must be after start date");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing && coupon) {
        const updateData: UpdateCouponInput = {
          code: formData.code.trim().toUpperCase(),
          type: formData.type,
          value: Number(formData.value),
          minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : undefined,
          maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
          perUserLimit: formData.perUserLimit ? Number(formData.perUserLimit) : undefined,
          startsAt: new Date(formData.startsAt).toISOString(),
          expiresAt: new Date(formData.expiresAt).toISOString(),
          isActive: formData.is_active,
        };
        const result = await updateCouponMut({ id: coupon.id, data: updateData });
        if (!result) {
          throw new Error("Failed to update coupon - check console for details");
        }
        toast.success("Coupon updated");
      } else {
        const createData: CreateCouponInput = {
          code: formData.code.trim().toUpperCase(),
          type: formData.type,
          value: Number(formData.value),
          minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : undefined,
          maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
          usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
          perUserLimit: formData.perUserLimit ? Number(formData.perUserLimit) : undefined,
          startsAt: new Date(formData.startsAt).toISOString(),
          expiresAt: new Date(formData.expiresAt).toISOString(),
        };
        const result = await createCouponMut(createData);
        if (!result) {
          throw new Error("Failed to create coupon - the API rejected the request");
        }
        toast.success("Coupon created");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save coupon");
    } finally {
      setIsSaving(false);
    }
  }, [formData, isEditing, coupon, createCouponMut, updateCouponMut, onOpenChange, onSaved]);

  const inputClass =
    "w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit coupon" : "New coupon"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Code *
              <input
                value={formData.code}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, code: e.target.value }))
                }
                placeholder="e.g. SUMMER2025"
                className={inputClass}
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Type *
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    type: e.target.value as "PERCENTAGE" | "FIXED",
                  }))
                }
                className={inputClass}
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Value *
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.value}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, value: e.target.value }))
                }
                placeholder={formData.type === "PERCENTAGE" ? "e.g. 15" : "e.g. 500"}
                className={inputClass}
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Min order amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minOrderAmount}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, minOrderAmount: e.target.value }))
                }
                placeholder="No minimum"
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Max discount
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.maxDiscount}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, maxDiscount: e.target.value }))
                }
                placeholder="No limit"
                className={inputClass}
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Usage limit
              <input
                type="number"
                min="0"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, usageLimit: e.target.value }))
                }
                placeholder="Unlimited"
                className={inputClass}
              />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium">
            Per-user limit
            <input
              type="number"
              min="0"
              value={formData.perUserLimit}
              onChange={(e) =>
                setFormData((p) => ({ ...p, perUserLimit: e.target.value }))
              }
              placeholder="Unlimited"
              className={inputClass}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Starts at *
              <input
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, startsAt: e.target.value }))
                }
                className={inputClass}
              />
            </label>

            <label className="space-y-2 text-sm font-medium">
              Expires at *
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, expiresAt: e.target.value }))
                }
                className={inputClass}
              />
            </label>
          </div>

          {isEditing && (
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, is_active: e.target.checked }))
                }
                className="h-4 w-4 rounded border-brand-border accent-brand-primary"
              />
              Active
            </label>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-textPrimary transition hover:bg-brand-bgLight"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="btn-press rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSaving ? "Saving..." : isEditing ? "Update coupon" : "Create coupon"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}