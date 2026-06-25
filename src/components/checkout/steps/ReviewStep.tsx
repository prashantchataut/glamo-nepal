"use client";

import Image from "next/image";
import Link from "next/link";
import { X, ShieldCheck, Truck, Gift, RotateCcw } from "lucide-react";
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
    <div className="space-y-4 md:space-y-5">
      <h2 className="font-display text-2xl font-semibold tracking-[-0.03em] text-neutral-950 md:text-3xl">
        Review order
      </h2>

      <div className="divide-y divide-neutral-200 rounded-[1.25rem] border border-neutral-200 md:rounded-[1.5rem]">
        {items.map((item) => (
          <div
            key={`${item.product.id}-${item.selectedShade || "base"}`}
            className="flex gap-3 p-3 md:gap-4 md:p-4"
          >
            <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-[0.75rem] bg-neutral-100 md:h-20 md:w-16 md:rounded-[1rem]">
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 56px, 64px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                {item.product.brand}
              </p>
              <p className="truncate text-sm font-semibold text-neutral-950">{item.product.name}</p>
              {item.selectedShade && (
                <p className="text-xs text-neutral-500">Shade: {item.selectedShade}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-neutral-950">
                {formatNPR(item.product.price * item.quantity)}
              </p>
              <p className="text-xs text-neutral-500">Qty {item.quantity}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[1.25rem] border border-neutral-200 bg-neutral-50 p-4 md:rounded-[1.5rem] md:p-5">
        <OrderSummaryLines
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          giftWrapFee={giftWrapFee}
          codFee={codFee}
          discountAmount={discountAmount}
          total={total}
        />
      </div>

      <div className="rounded-[1.25rem] border border-neutral-200 p-4 text-sm leading-7 text-neutral-600 md:rounded-[1.5rem] md:p-5">
        <p className="font-semibold text-neutral-950">Shipping to</p>
        <p>{form.name}</p>
        <p>{form.address}, Ward {form.ward}, {form.city}, {form.district}, {form.province}</p>
        <p>{form.phone}</p>
        <p className="mt-2 font-semibold text-neutral-950">Payment: {form.payment}</p>
      </div>

      {submitError && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-[1rem] border border-error/30 bg-error/5 px-4 py-3 md:rounded-[1.25rem]">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-error">{submitError}</p>
            <button
              type="button"
              onClick={() => { onDismissError(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-error underline-offset-4 hover:underline"
            >
              Try again
            </button>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className="shrink-0 text-error/70 transition hover:text-error"
            aria-label="Dismiss error"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-neutral-600">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
          Secure checkout
        </span>
        <span className="flex items-center gap-1.5">
          <Truck size={14} className="shrink-0 text-primary" />
          Valley delivery
        </span>
        <span className="flex items-center gap-1.5">
          <RotateCcw size={14} className="shrink-0 text-primary" />
          7-day returns
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 rounded-full border border-neutral-200 px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-700 hover:border-neutral-400"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!canSubmit || isSubmitting}
          onClick={onSubmit}
          className="min-h-12 flex-1 rounded-full bg-neutral-950 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-primary disabled:cursor-not-allowed disabled:bg-neutral-300"
        >
          {isSubmitting ? "Placing order..." : "Place order"}
        </button>
      </div>

      <div className="mt-2 flex flex-col gap-2 rounded-[1rem] border border-neutral-200 bg-neutral-50 p-4 md:rounded-[1.25rem]">
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
          <span>Secure checkout - your details are encrypted</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <Truck size={14} className="shrink-0 text-primary" />
          <span>Delivery within Kathmandu Valley</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <RotateCcw size={14} className="shrink-0 text-primary" />
          <span>Easy returns - <Link href="/return-policy" className="underline hover:text-primary">return policy</Link></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-neutral-600">
          <Gift size={14} className="shrink-0 text-primary" />
          <span>Gift wrap available at checkout</span>
        </div>
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
    <div className="space-y-3 text-sm">
      <div className="flex justify-between text-neutral-500">
        <span>Subtotal</span>
        <span className="text-neutral-950">{formatNPR(subtotal)}</span>
      </div>
      <div className="flex justify-between text-neutral-500">
        <span>Delivery</span>
        <span className="text-neutral-950">{deliveryFee === 0 ? "Free" : formatNPR(deliveryFee)}</span>
      </div>
      {codFee > 0 && (
        <div className="flex justify-between text-neutral-500">
          <span>COD fee</span>
          <span className="text-neutral-950">{formatNPR(codFee)}</span>
        </div>
      )}
      {giftWrapFee > 0 && (
        <div className="flex justify-between text-neutral-500">
          <span>Gift wrap</span>
          <span className="text-neutral-950">{formatNPR(giftWrapFee)}</span>
        </div>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between text-primary">
          <span>Discount</span>
          <span>-{formatNPR(discountAmount)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-neutral-200 pt-4 text-neutral-950">
        <span className="font-semibold">Total</span>
        <span className="font-display text-3xl font-semibold leading-none">{formatNPR(total)}</span>
      </div>
    </div>
  );
}