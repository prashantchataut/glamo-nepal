"use client";

import { useState } from "react";
import Link from "next/link";
import NextImage from "next/image";
import { Package, Search, Truck, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { ordersApi } from "@/lib/api/orders";
import { GlamoApiError } from "@/lib/api/client";
import { formatNPR } from "@/lib/utils";

const STATUS_STEPS = [
  { key: "PENDING", label: "Order Placed", icon: Clock },
  { key: "CONFIRMED", label: "Confirmed", icon: CheckCircle2 },
  { key: "PROCESSING", label: "Processing", icon: Package },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
] as const;

const PAYMENT_LABELS: Record<string, string> = {
  CASH_ON_DELIVERY: "Cash on Delivery",
  KHALTI: "Khalti",
  ESEWA: "eSewa",
  BANK_TRANSFER: "Bank Transfer",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

function getStepIndex(status: string): number {
  const upper = status.toUpperCase();
  if (upper === "CANCELLED") return -1;
  if (upper === "REFUNDED") return -2;
  const idx = STATUS_STEPS.findIndex((s) => s.key === upper);
  return idx >= 0 ? idx : 0;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-NP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

interface OrderItem {
  id: string;
  productName: string;
  variantName?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  imageUrl?: string | null;
  sku?: string | null;
}

interface StatusEntry {
  id: string;
  status: string;
  comment?: string | null;
  createdAt: string;
}

interface TrackedOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingCharge: number;
  discountAmount: number;
  totalAmount: number;
  shippingAddress: Record<string, unknown> | null;
  items: OrderItem[];
  statusHistory: StatusEntry[];
  createdAt: string;
}

export default function TrackOrderClient() {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = orderNumber.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const result = await ordersApi.trackByOrderNumber(trimmed);
      if (result.data) {
        setOrder(result.data as unknown as TrackedOrder);
      } else {
        setError("Order not found. Please check your order number and try again.");
      }
    } catch (err) {
      if (err instanceof GlamoApiError) {
        if (err.status === 404) {
          setError("Order not found. Please check your order number and try again.");
        } else {
          setError(err.message || "Something went wrong. Please try again.");
        }
      } else {
        setError("Unable to connect. Please check your internet and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order ? getStepIndex(order.status) : 0;
  const isCancelled = order?.status?.toUpperCase() === "CANCELLED";
  const isRefunded = order?.status?.toUpperCase() === "REFUNDED";

  return (
    <div className="min-h-screen bg-neutral-50">
      <section className="relative overflow-hidden bg-rose-50 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6">
          <nav className="mb-5 flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/" className="cursor-pointer transition-colors hover:text-primary">Home</Link>
            <span>/</span>
            <span className="text-neutral-900">Track Order</span>
          </nav>
          <h1 className="font-display text-5xl font-semibold leading-[0.98] text-neutral-900 md:text-7xl">
            Track your <span className="italic text-primary">order</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-500">
            Enter your order number to check the current status. No login required.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="Enter order number (e.g. GL-20250101-ABCD)"
                className="min-h-14 w-full rounded-full border border-neutral-200 bg-white pl-12 pr-4 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
                aria-label="Order number"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !orderNumber.trim()}
              className="inline-flex min-h-14 min-w-[120px] items-center justify-center rounded-full bg-neutral-950 px-6 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : "Track"}
            </button>
          </form>

          {error && (
            <div className="mt-6 rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-center">
              <XCircle size={36} className="mx-auto mb-3 text-red-400" />
              <p className="font-display text-xl font-semibold text-red-700">{error}</p>
              <p className="mt-2 text-sm text-red-500">
                Check your order confirmation email for the correct order number, or{" "}
                <Link href="/contact" className="underline hover:text-red-700">contact support</Link>.
              </p>
            </div>
          )}

          {order && (
            <div className="mt-8 space-y-6">
              <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-soft md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Order Number</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-neutral-900">{order.orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">Date</p>
                    <p className="mt-1 text-sm font-medium text-neutral-700">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    isCancelled ? "bg-red-100 text-red-700" : isRefunded ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {isCancelled ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                    {STATUS_LABELS[order.status.toUpperCase()] || order.status}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    order.paymentStatus?.toUpperCase() === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {order.paymentStatus?.toUpperCase() === "PAID" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                    Payment: {order.paymentStatus?.toUpperCase() === "PAID" ? "Paid" : "Pending"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-neutral-600">
                    {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                  </span>
                </div>
              </div>

              {!isCancelled && !isRefunded && (
                <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-soft md:p-8">
                  <h2 className="font-display text-lg font-semibold text-neutral-900">Order Progress</h2>
                  <div className="mt-6 relative">
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-neutral-200" />
                    <div
                      className="absolute left-[15px] top-2 w-0.5 bg-primary transition-all duration-500"
                      style={{ height: currentStep >= 0 ? `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%` : "0%" }}
                    />
                    {STATUS_STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStep;
                      const isCurrent = idx === currentStep;
                      const Icon = step.icon;
                      const historyEntry = order.statusHistory?.find((h) => h.status.toUpperCase() === step.key);
                      return (
                        <div key={step.key} className="relative flex items-start gap-4 pb-6 last:pb-0">
                          <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            isCompleted ? "border-primary bg-primary text-white" : "border-neutral-300 bg-white text-neutral-400"
                          } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                            <Icon size={16} />
                          </div>
                          <div className="pt-0.5">
                            <p className={`text-sm font-semibold ${isCompleted ? "text-neutral-900" : "text-neutral-500"}`}>
                              {step.label}
                              {isCurrent && <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-primary">Current</span>}
                            </p>
                            {historyEntry && (
                              <p className="mt-0.5 text-xs text-neutral-500">{formatDate(historyEntry.createdAt)}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(isCancelled || isRefunded) && order.statusHistory?.length > 0 && (
                <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-soft md:p-8">
                  <h2 className="font-display text-lg font-semibold text-neutral-900">Status History</h2>
                  <div className="mt-4 space-y-3">
                    {order.statusHistory.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 text-sm">
                        <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          entry.status.toUpperCase() === "CANCELLED" ? "bg-red-400" : entry.status.toUpperCase() === "REFUNDED" ? "bg-amber-400" : "bg-emerald-400"
                        }`} />
                        <div>
                          <p className="font-medium text-neutral-900">{STATUS_LABELS[entry.status.toUpperCase()] || entry.status}</p>
                          <p className="text-neutral-500">{formatDate(entry.createdAt)}{entry.comment ? ` — ${entry.comment}` : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-soft md:p-8">
                <h2 className="font-display text-lg font-semibold text-neutral-900">Items</h2>
                <ul className="mt-4 divide-y divide-neutral-100">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                      {item.imageUrl ? (
                        <NextImage src={item.imageUrl} alt={item.productName} width={56} height={56} className="h-14 w-14 shrink-0 rounded-xl border border-neutral-100 object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-neutral-100 bg-neutral-50">
                          <Package size={20} className="text-neutral-300" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{item.productName}</p>
                        {item.variantName && <p className="text-xs text-neutral-500">{item.variantName}</p>}
                        <p className="mt-0.5 text-xs text-neutral-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-neutral-900">{formatNPR(item.totalPrice)}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
                  <div className="flex justify-between text-neutral-500">
                    <span>Subtotal</span>
                    <span>{formatNPR(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-500">
                    <span>Shipping</span>
                    <span>{order.shippingCharge > 0 ? formatNPR(order.shippingCharge) : "Free"}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>-{formatNPR(order.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold text-neutral-900">
                    <span>Total</span>
                    <span>{formatNPR(order.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {order.shippingAddress && (
                <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-soft md:p-8">
                  <h2 className="font-display text-lg font-semibold text-neutral-900">Shipping Address</h2>
                  <div className="mt-3 text-sm leading-relaxed text-neutral-600">
                    <p className="font-medium text-neutral-900">{(order.shippingAddress as Record<string, unknown>).fullName as string || ""}</p>
                    <p>{[
                      (order.shippingAddress as Record<string, unknown>).address1 || (order.shippingAddress as Record<string, unknown>).addressLine1,
                      (order.shippingAddress as Record<string, unknown>).address2 || (order.shippingAddress as Record<string, unknown>).addressLine2,
                    ].filter(Boolean).join(", ")}</p>
                    <p>{[
                      (order.shippingAddress as Record<string, unknown>).city,
                      (order.shippingAddress as Record<string, unknown>).district,
                      (order.shippingAddress as Record<string, unknown>).province,
                    ].filter(Boolean).join(", ")}</p>
                    {(String((order.shippingAddress as Record<string, unknown>).phone ?? "")) ? (
                      <p className="mt-1">Phone: {String((order.shippingAddress as Record<string, unknown>).phone)}</p>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="text-center">
                <Link
                  href="/shop"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-neutral-950 px-8 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-primary"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}