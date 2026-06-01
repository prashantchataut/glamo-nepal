"use client";

import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { adminApi } from "@/lib/api/admin";
import { useAdminData } from "@/lib/hooks/useAdminData";
import { formatNPR } from "@/lib/utils";
import { StatusPill, orderStatusToVariant } from "@/components/admin/shared/StatusPill";
import { Package, User, MapPin, Clock } from "lucide-react";
import NextImage from "next/image";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const PAYMENT_LABELS: Record<string, string> = {
  khalti: "Khalti",
  esewa: "eSewa",
  cod: "Cash on Delivery",
  card: "Card",
};

interface OrderDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
}

export function OrderDetailModal({ open, onOpenChange, orderId }: OrderDetailModalProps) {
  const { data: order, isLoading, error, refetch } = useAdminData(
    useCallback(
      () => adminApi.getOrder(orderId!),
      [orderId],
    ),
    { enabled: !!orderId && open },
  );

  const parsedAddress = order?.shipping_address
    ? (() => {
        try {
          return JSON.parse(order.shipping_address) as {
            fullName?: string;
            phone?: string;
            addressLine1?: string;
            addressLine2?: string;
            city?: string;
            state?: string;
            postalCode?: string;
            country?: string;
          };
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package size={18} />
            {order ? `Order ${order.order_number}` : "Order details"}
          </DialogTitle>
          <DialogDescription>
            {order ? `Placed on ${new Date(order.created_at).toLocaleDateString("en-NP", { year: "numeric", month: "long", day: "numeric" })}` : "Loading order details..."}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-4 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-brand-bgLight" />
            ))}
          </div>
        )}

        {error && (
          <div className="py-8 text-center">
            <p className="text-sm text-admin-error">{error}</p>
            <button onClick={refetch} className="mt-2 text-sm font-medium text-brand-primary hover:underline">
              Try again
            </button>
          </div>
        )}

        {order && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill variant={orderStatusToVariant(order.status)}>
                {STATUS_LABELS[order.status] ?? order.status}
              </StatusPill>
              <span className="text-xs text-brand-textMuted">
                Payment: <span className="font-medium text-brand-textPrimary">{PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</span>
                {order.payment_status && (
                  <> &middot; <span className={order.payment_status === "PAID" ? "text-admin-success" : "text-admin-warning"}>{order.payment_status}</span></>
                )}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-brand-border p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-brand-textMuted">
                  <User size={14} /> Customer
                </div>
                {order.customer ? (
                  <div className="mt-2">
                    <p className="font-semibold">{order.customer.first_name} {order.customer.last_name}</p>
                    <p className="text-sm text-brand-textMuted">{order.customer.email}</p>
                    {order.customer.phone && <p className="text-sm text-brand-textMuted">{order.customer.phone}</p>}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-brand-textMuted">Guest checkout</p>
                )}
              </div>

              <div className="rounded-xl border border-brand-border p-4">
                <div className="flex items-center gap-2 text-xs font-medium text-brand-textMuted">
                  <MapPin size={14} /> Shipping address
                </div>
                {parsedAddress ? (
                  <div className="mt-2 text-sm">
                    <p className="font-semibold">{parsedAddress.fullName}</p>
                    <p>{parsedAddress.addressLine1}</p>
                    {parsedAddress.addressLine2 && <p>{parsedAddress.addressLine2}</p>}
                    <p>{parsedAddress.city}{parsedAddress.state ? `, ${parsedAddress.state}` : ""} {parsedAddress.postalCode}</p>
                    <p>{parsedAddress.country ?? "Nepal"}</p>
                    {parsedAddress.phone && <p className="text-brand-textMuted">{parsedAddress.phone}</p>}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-brand-textMuted whitespace-pre-wrap">{order.shipping_address}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Order items</h3>
              <div className="mt-2 space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-brand-border p-3">
                    <div className="flex items-center gap-3">
                      {item.image_url && (
                        <NextImage src={item.image_url} alt={item.product_name} width={40} height={40} className="h-10 w-10 rounded-lg object-cover" unoptimized />
                      )}
                      <div>
                        <p className="text-sm font-semibold">{item.product_name}</p>
                        {item.variant_name && <p className="text-xs text-brand-textMuted">{item.variant_name}</p>}
                        {item.sku && <p className="text-xs text-brand-textMuted">SKU: {item.sku}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatNPR(item.unit_price)}</p>
                      <p className="text-xs text-brand-textMuted">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-brand-border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-brand-textMuted">Subtotal</span>
                <span>{formatNPR(order.subtotal)}</span>
              </div>
              {order.shipping_charge > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-textMuted">Shipping</span>
                  <span>{formatNPR(order.shipping_charge)}</span>
                </div>
              )}
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-brand-textMuted">Discount</span>
                  <span className="text-admin-success">-{formatNPR(order.discount_amount)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-brand-border pt-2 font-semibold">
                <span>Total</span>
                <span>{formatNPR(order.total_amount)}</span>
              </div>
            </div>

            {order.status_history && order.status_history.length > 0 && (
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Clock size={14} /> Status history
                </h3>
                <div className="mt-3 space-y-3">
                  {order.status_history.map((entry, i) => (
                    <div key={entry.id} className="relative flex gap-3 pb-3">
                      {i < order.status_history!.length - 1 && (
                        <div className="absolute left-[7px] top-5 h-full w-px bg-brand-border" />
                      )}
                      <div className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${i === 0 ? "border-brand-primary bg-brand-primary" : "border-brand-border bg-white"}`} />
                      <div>
                        <p className="text-sm font-medium">{STATUS_LABELS[entry.status] ?? entry.status}</p>
                        <p className="text-xs text-brand-textMuted">{new Date(entry.created_at).toLocaleString()}</p>
                        {entry.comment && <p className="mt-0.5 text-xs text-brand-textMuted">{entry.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {order.notes && (
              <div className="rounded-xl border border-brand-border p-4">
                <h3 className="text-sm font-semibold">Notes</h3>
                <p className="mt-1 text-sm text-brand-textMuted">{order.notes}</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}