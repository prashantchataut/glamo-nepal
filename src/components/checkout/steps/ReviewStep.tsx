"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertCircle, X, ShieldCheck, Truck, Gift, RotateCcw, CreditCard, MapPin, Loader2 } from "lucide-react";
import type { CheckoutFormData } from "@/lib/validations/checkout";
import type { CartItem } from "@/store/useCartStore";
import { formatNPR } from "@/lib/utils";

interface ReviewStepProps {
  form: CheckoutFormData;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  giftWrapFee: number;
  codFee: number;
  discountAmount: number;
  total: number;
  isSubmitting: boolean;
  canSubmit: boolean;
  submitError: string | null;
  onBack: () => void;
  onSubmit: () => void;
  onDismissError: () => void;
}

export function ReviewStep({
  form,
  items,
  subtotal,
  deliveryFee,
  giftWrapFee,
  codFee,
  discountAmount,
  total,
  isSubmitting,
  canSubmit,
  submitError,
  onBack,
  onSubmit,
  onDismissError,
}: ReviewStepProps) {
  return (
    <div className="space-y-5 md:space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Step 4 of 4</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-[-0.03em] text-neutral-950 md:text-3xl">
          Review and place your order
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          Please confirm your items, delivery address and payment method before placing the order.
        </p>
      </div>

      {/* Items list */}
      <div className="divide-y divide-neutral-200 rounded-[1.5rem] border border-neutral-200 bg-white md:rounded-[1.5rem]">
        <div className="flex items-center justify-between px-4 py-3 md:px-5 md:py-4">
          <p className="text-xs font-semibold text-neutral-500">
            Items ({items.reduce((sum, i) => sum + i.quantity, 0)})
          </p>
        </div>
        {items.map((item) => (
          <div
            key={`${item.product.id}-${item.selectedShade || "base"}`}
            className="flex gap-3 p-3 md:gap-4 md:p-4"
          >
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-[0.75rem] bg-neutral-100 md:h-20 md:w-16 md:rounded-xl">
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 56px, 64px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-neutral-500">
                {item.product.brand}
              </p>
              <p className="truncate text-sm font-semibold text-neutral-950">{item.product.name}</p>
              {item.selectedShade && (
                <p className="mt-0.5 text-xs text-neutral-500">Shade: {item.selectedShade}</p>
              )}
              <p className="mt-1 text-xs text-neutral-500">
                {formatNPR(item.product.price)} each &middot; Qty {item.quantity}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-neutral-950">
                {formatNPR(item.product.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div className="rounded-[1.5rem] border border-neutral-200 bg-neutral-50 p-4 md:rounded-[1.5rem] md:p-5">
        <OrderSummaryLines
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          giftWrapFee={giftWrapFee}
          codFee={codFee}
          discountAmount={discountAmount}
          total={total}
        />
      </div>

      {/* Shipping + payment combined card */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 md:rounded-[1.5rem] md:p-5">
          <div className="flex items-center gap-2 text-primary">
            <MapPin size={15} />
            <p className="text-xs font-semibold text-neutral-500">Shipping to</p>
          </div>
          <div className="mt-2 text-sm leading-6 text-neutral-700">
            <p className="font-semibold text-neutral-950">{form.name}</p>
            <p>{form.address}, Ward {form.ward}</p>
            <p>{form.city}, {form.district}</p>
            <p>{form.province}, Nepal</p>
            <p className="mt-1 text-neutral-500">{form.phone}</p>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 md:rounded-[1.5rem] md:p-5">
          <div className="flex items-center gap-2 text-primary">
            <CreditCard size={15} />
            <p className="text-xs font-semibold text-neutral-500">Payment method</p>
          </div>
          <p className="mt-2 font-semibold text-neutral-950">{form.payment}</p>
          {form.payment === "Cash on Delivery" && (
            <p className="mt-1 text-xs text-neutral-500">Pay with cash when your order arrives. A small handling fee applies.</p>
          )}
          {form.giftWrap && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-600">
              <Gift size={12} className="text-primary" />
              Gift wrap added ({formatNPR(giftWrapFee)})
            </p>
          )}
        </div>
      </div>

      {/* Error banner - friendlier tone */}
      {submitError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 md:rounded-[1.5rem]">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-amber-900">{submitError}</p>
            <button
              type="button"
              onClick={() => { onDismissError(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="mt-1.5 inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold text-amber-700 underline-offset-4 hover:underline"
            >
              Try again
            </button>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className="shrink-0 text-amber-500 transition hover:text-amber-700"
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Trust badges row */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
          Secure checkout
        </span>
        <span className="flex items-center gap-1.5">
          <Truck size={14} className="shrink-0 text-primary" />
          Nationwide delivery
        </span>
        <span className="flex items-center gap-1.5">
          <RotateCcw size={14} className="shrink-0 text-primary" />
          <Link href="/return-policy" className="hover:text-primary hover:underline">7-day returns</Link>
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="min-h-12 rounded-full border border-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-700 transition hover:border-neutral-400 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          onClick={onSubmit}
          className="min-h-12 flex-1 rounded-full bg-neutral-950 px-8 py-3.5 text-sm font-semibold text-neutral-50 transition hover:bg-primary disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Placing order...
            </span>
          ) : (
            `Place order · ${formatNPR(total)}`
          )}
        </button>
      </div>
    </div>
  );
}

export function OrderSummaryLines({
  subtotal,
  deliveryFee,
  giftWrapFee,
  codFee,
  discountAmount,
  total,
}: {
  subtotal: number;
  deliveryFee: number;
  giftWrapFee: number;
  codFee: number;
  discountAmount: number;
  total: number;
}) {
  return (
    <div className="space-y-2.5 text-sm">
      <div className="flex justify-between text-neutral-600">
        <span>Subtotal</span>
        <span className="font-medium text-neutral-950">{formatNPR(subtotal)}</span>
      </div>
      <div className="flex justify-between text-neutral-600">
        <span>Delivery</span>
        <span className="font-medium text-neutral-950">{deliveryFee === 0 ? "Free" : formatNPR(deliveryFee)}</span>
      </div>
      {codFee > 0 && (
        <div className="flex justify-between text-neutral-600">
          <span>COD handling (3%)</span>
          <span className="font-medium text-neutral-950">{formatNPR(codFee)}</span>
        </div>
      )}
      {giftWrapFee > 0 && (
        <div className="flex justify-between text-neutral-600">
          <span className="flex items-center gap-1.5">
            <Gift size={12} className="text-primary" />
            Gift wrap
          </span>
          <span className="font-medium text-neutral-950">{formatNPR(giftWrapFee)}</span>
        </div>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between text-primary">
          <span>Discount</span>
          <span className="font-medium">-{formatNPR(discountAmount)}</span>
        </div>
      )}
      <div className="mt-2 flex items-end justify-between border-t border-neutral-200 pt-3 text-neutral-950">
        <span className="font-semibold">Total</span>
        <span className="font-display text-3xl font-semibold leading-none">{formatNPR(total)}</span>
      </div>
    </div>
  );
}