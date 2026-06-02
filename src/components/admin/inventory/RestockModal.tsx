"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAdjustStock } from "@/lib/hooks/useConvexQueries";
import type { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";

interface RestockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: Id<"products">;
  productName: string;
  currentStock: number;
  onRestocked?: () => void;
}

export function RestockModal({ open, onOpenChange, productId, productName, currentStock, onRestocked }: RestockModalProps) {
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const adjustStock = useAdjustStock();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity === 0) return;

    setIsSubmitting(true);
    try {
      await adjustStock({ productId, change: quantity, reason: reason || undefined });
      toast.success(quantity > 0 ? "Stock restocked successfully" : "Stock adjusted successfully");
      setQuantity(0);
      setReason("");
      onOpenChange(false);
      onRestocked?.();
    } catch {
      toast.error("Failed to update stock. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setQuantity(0); setReason(""); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            Update stock for {productName}. Current stock: {currentStock} units.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">
              New stock will be: <span className="font-bold">{currentStock + quantity}</span> units
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => q - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border text-lg font-bold hover:bg-brand-bgLight"
              >
                &minus;
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value) || 0)}
                className="w-24 rounded-xl border border-brand-border bg-brand-bgLight px-3 py-2 text-center text-sm font-semibold outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
              />
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-border text-lg font-bold hover:bg-brand-bgLight"
              >
                +
              </button>
            </div>

            <div className="mt-2 flex gap-2">
              {[5, 10, 25, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuantity(n)}
                  className="rounded-full border border-brand-border px-3 py-1 text-xs font-medium hover:bg-brand-bgLight"
                >
                  +{n}
                </button>
              ))}
            </div>
          </div>

          <label className="space-y-2 text-sm font-medium">
            Reason (optional)
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Restock from supplier"
              className="w-full rounded-xl border border-brand-border bg-brand-bgLight px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"
            />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-brand-border px-6 py-2 text-sm font-medium text-brand-textPrimary hover:bg-brand-bgLight"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={quantity === 0 || isSubmitting}
              className="btn-press rounded-full bg-brand-primary px-6 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {isSubmitting ? "Updating..." : quantity > 0 ? `Add ${quantity} units` : `Remove ${Math.abs(quantity)} units`}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}