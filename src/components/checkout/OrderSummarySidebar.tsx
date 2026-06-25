"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronDown, LockKeyhole, ShieldCheck, Truck, Gift, Tag, Loader2 } from "lucide-react";
import type { CartItem } from "@/store/useCartStore";
import { OrderSummaryLines } from "./steps/ReviewStep";
import { formatNPR } from "@/lib/utils";

interface OrderSummarySidebarProps {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  giftWrapFee: number;
  codFee: number;
  discountAmount: number;
  total: number;
  couponCode: string | null;
  couponError: string | null;
  couponLoading: boolean;
  couponInput: string;
  onCouponInputChange: (value: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
}

export function OrderSummarySidebar({
  items,
  subtotal,
  deliveryFee,
  giftWrapFee,
  codFee,
  discountAmount,
  total,
  couponCode,
  couponError,
  couponLoading,
  couponInput,
  onCouponInputChange,
  onApplyCoupon,
  onRemoveCoupon,
}: OrderSummarySidebarProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Mobile: collapsible summary */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="flex w-full items-center justify-between rounded-[1.25rem] border border-neutral-200 bg-white px-4 py-3 shadow-editorial md:rounded-[1.5rem]"
          aria-expanded={mobileExpanded}
        >
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-text">Your bag</span>
            <span className="text-sm text-neutral-500">{itemCount} item{itemCount === 1 ? "" : "s"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-semibold text-neutral-950">{formatNPR(total)}</span>
            <ChevronDown size={18} className={`text-neutral-500 transition-transform ${mobileExpanded ? "rotate-180" : ""}`} />
          </div>
        </button>

        {mobileExpanded && (
          <div className="mt-2 rounded-[1.25rem] border border-neutral-200 bg-white p-4 shadow-editorial md:rounded-[1.5rem] md:p-5">
            <CartItems items={items} />
            <CouponSection
              couponCode={couponCode}
              couponError={couponError}
              couponLoading={couponLoading}
              couponInput={couponInput}
              onCouponInputChange={onCouponInputChange}
              onApplyCoupon={onApplyCoupon}
              onRemoveCoupon={onRemoveCoupon}
              discountAmount={discountAmount}
            />
            <div className="mt-4 border-t border-neutral-200 pt-4">
              <OrderSummaryLines
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                giftWrapFee={giftWrapFee}
                codFee={codFee}
                discountAmount={discountAmount}
                total={total}
              />
            </div>
            <TrustSignals />
          </div>
        )}
      </div>

      {/* Desktop: sticky sidebar */}
      <aside className="hidden lg:block rounded-[1.5rem] border border-neutral-200 bg-white p-6 shadow-editorial lg:sticky lg:top-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-text">Bag summary</p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-neutral-950 md:text-4xl">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </h2>
        <div className="mt-4 max-h-[360px] space-y-2.5 overflow-auto pr-1 md:space-y-3">
          <CartItems items={items} />
        </div>
        <div className="mt-4 border-t border-neutral-200 pt-4 md:mt-6 md:pt-5">
          <CouponSection
            couponCode={couponCode}
            couponError={couponError}
            couponLoading={couponLoading}
            couponInput={couponInput}
            onCouponInputChange={onCouponInputChange}
            onApplyCoupon={onApplyCoupon}
            onRemoveCoupon={onRemoveCoupon}
            discountAmount={discountAmount}
          />
          <div className="mt-4">
            <OrderSummaryLines
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              giftWrapFee={giftWrapFee}
              codFee={codFee}
              discountAmount={discountAmount}
              total={total}
            />
          </div>
        </div>
        <TrustSignals />
      </aside>
    </>
  );
}

function CartItems({ items }: { items: CartItem[] }) {
  return (
    <>
      {items.map((item) => (
        <div
          key={`${item.product.id}-${item.selectedShade || "base"}-summary`}
          className="flex gap-3 rounded-[1rem] bg-neutral-50 p-2.5 md:rounded-[1.25rem] md:p-3"
        >
          <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-[0.75rem] bg-neutral-100 md:h-16 md:w-14 md:rounded-[1rem]">
            <Image
              src={item.product.image}
              alt={item.product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 48px, 56px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-neutral-950">{item.product.name}</p>
            <p className="text-xs text-neutral-500">Qty {item.quantity}</p>
          </div>
        </div>
      ))}
    </>
  );
}

function CouponSection({
  couponCode,
  couponError,
  couponLoading,
  couponInput,
  onCouponInputChange,
  onApplyCoupon,
  onRemoveCoupon,
  discountAmount,
}: {
  couponCode: string | null;
  couponError: string | null;
  couponLoading: boolean;
  couponInput: string;
  onCouponInputChange: (value: string) => void;
  onApplyCoupon: () => void;
  onRemoveCoupon: () => void;
  discountAmount: number;
}) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Promo code</p>
      {couponCode ? (
        <div className="flex items-center justify-between rounded-[1.15rem] border border-primary/30 bg-primary/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-primary" />
            <span className="text-sm font-semibold text-neutral-950">
              {couponCode.slice(0, 2)}{"•".repeat(Math.max(0, couponCode.length - 2))}
            </span>
            {discountAmount > 0 && <span className="text-xs text-primary">-{formatNPR(discountAmount)}</span>}
          </div>
          <button
            type="button"
            onClick={onRemoveCoupon}
            className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500 transition hover:text-error"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={couponInput}
            onChange={(e) => onCouponInputChange(e.target.value)}
            placeholder="Enter code"
            className="flex-1 rounded-[1.15rem] border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-950 placeholder:text-neutral-400 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (couponInput.trim()) onApplyCoupon(); } }}
          />
          <button
            type="button"
            onClick={() => { if (couponInput.trim()) onApplyCoupon(); }}
            disabled={!couponInput.trim() || couponLoading}
            className="rounded-full bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            {couponLoading ? <Loader2 size={16} className="animate-spin" /> : "Apply"}
          </button>
        </div>
      )}
      {couponError && <p className="mt-1.5 text-xs text-error">{couponError}</p>}
    </div>
  );
}

function TrustSignals() {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex gap-3 rounded-[1rem] bg-neutral-950 p-3.5 text-white md:rounded-[1.25rem] md:p-4">
        <LockKeyhole size={18} className="mt-0.5 shrink-0 text-secondary" />
        <p className="text-xs leading-5 text-white/75">Secure checkout. Your details are encrypted and never shared.</p>
      </div>
      <div className="space-y-2 text-xs leading-5 text-neutral-500">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="shrink-0 text-primary" />
          <span>Authentic products, verified before dispatch</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck size={14} className="shrink-0 text-primary" />
          <span>Delivery within Kathmandu Valley</span>
        </div>
        <div className="flex items-center gap-2">
          <Gift size={14} className="shrink-0 text-primary" />
          <span>Gift wrap available at checkout</span>
        </div>
      </div>
    </div>
  );
}