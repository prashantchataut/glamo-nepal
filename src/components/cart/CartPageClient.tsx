"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Gift,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { FREE_DELIVERY_THRESHOLD, calculateDeliveryFee } from "@/lib/delivery";
import { cn, formatNPR } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { trackCheckoutStart } from "@/lib/tracking";
import { ProductRecommendationStrip } from "@/components/product/ProductRecommendationStrip";

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between text-sm",
        strong ? "font-semibold text-neutral-950" : "text-neutral-500",
      )}
    >
      <span>{label}</span>
      <span className={strong ? "font-display text-2xl" : "text-neutral-900"}>
        {value}
      </span>
    </div>
  );
}

export function CartPageClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCartStore((state) => state.items);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const subtotal = getSubtotal();
  const delivery = calculateDeliveryFee(subtotal, "Kathmandu", "Bagmati");
  const total = subtotal + delivery;
  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );
  const progress = Math.min(
    100,
    Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100),
  );
  const remainingForFreeDelivery = Math.max(
    0,
    FREE_DELIVERY_THRESHOLD - subtotal,
  );

  if (!mounted) {
    return (
      <main className="bg-brand-bgLight py-12 page-padding">
        <div className="mx-auto max-w-7xl">
          <div className="h-8 w-32 skeleton-shimmer rounded-full" />
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="space-y-4">
              <div className="h-40 skeleton-shimmer rounded-[2rem]" />
              <div className="h-40 skeleton-shimmer rounded-[2rem]" />
            </div>
            <div className="h-80 skeleton-shimmer rounded-[2rem]" />
          </div>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="min-h-[72vh] bg-brand-bgLight px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl rounded-[2.5rem] border border-neutral-200 bg-white p-8 text-center shadow-editorial md:p-12">
          <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-brand-surfacePink text-primary">
            <ShoppingBag size={28} />
          </div>
          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
            Your beauty bag
          </p>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-none tracking-[-0.04em] text-neutral-950 md:text-6xl">
            Your bag is ready for its first glow pick.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-neutral-500">
            Browse curated skincare, makeup and fragrance essentials selected
            for Nepal delivery.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-neutral-950 px-8 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-primary"
          >
            Start shopping
          </Link>
        </div>
        <div className="mx-auto mt-10 max-w-7xl">
          <ProductRecommendationStrip
            title="Recommended for you"
            subtitle="Editor picks"
            context="cart"
            limit={4}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="bg-brand-bgLight px-4 py-6 pb-24 md:px-6 md:py-12 md:pb-12">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/shop"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-primary"
        >
          <ArrowLeft size={16} /> Continue shopping
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 lg:items-start">
          <section>
            <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-[0_18px_70px_-56px_rgba(26,21,18,0.55)] md:rounded-[2.25rem] md:p-5 md:shadow-[0_18px_70px_-56px_rgba(26,21,18,0.55)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                Shopping bag
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <h1 className="font-display text-4xl font-semibold leading-none tracking-[-0.04em] text-neutral-950 md:text-5xl md:tracking-[-0.05em]">
                  Ready for checkout
                </h1>
                <p className="text-sm text-neutral-500">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="mt-5 rounded-[1.25rem] border border-neutral-200 bg-brand-bgLight p-3.5 md:mt-7 md:rounded-[1.5rem] md:p-4">
                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <Truck size={18} className="text-primary" />{" "}
                  {remainingForFreeDelivery === 0
                    ? "You have unlocked free delivery."
                    : `${formatNPR(remainingForFreeDelivery)} away from free delivery.`}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-3 md:mt-5 md:space-y-4">
              {items.map((item) => (
                <article
                  key={`${item.product.id}-${item.selectedShade || "base"}`}
                  className="grid grid-cols-[80px_minmax(0,1fr)] gap-3 rounded-[1.5rem] border border-neutral-200 bg-white p-3 shadow-[0_18px_60px_-52px_rgba(26,21,18,0.35)] sm:grid-cols-[136px_minmax(0,1fr)] sm:gap-6 sm:rounded-[2rem] sm:p-5 sm:shadow-[0_18px_60px_-52px_rgba(26,21,18,0.45)]"
                >
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="relative aspect-[4/5] overflow-hidden rounded-[1rem] bg-brand-surfaceWarm sm:rounded-[1.5rem]"
                  >
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover transition duration-700 hover:scale-[1.03]"
                      sizes="(max-width: 640px) 104px, 136px"
                    />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                          {item.product.brand}
                        </p>
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="mt-1 block font-display text-xl font-semibold leading-none tracking-[-0.03em] text-neutral-950 transition hover:text-primary sm:text-2xl"
                        >
                          {item.product.name}
                        </Link>
                        {item.selectedShade ? (
                          <p className="mt-1.5 text-xs text-neutral-500 sm:mt-2">
                            Shade: {item.selectedShade}
                          </p>
                        ) : null}
                      </div>
                      <button
                        onClick={() =>
                          removeItem(item.product.id, item.selectedShade)
                        }
                        className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-error sm:min-h-11 sm:min-w-11"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="inline-flex w-fit items-center rounded-full border border-neutral-200 bg-neutral-50">
                        <button
                          type="button"
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.selectedShade,
                            )
                          }
                          className="flex min-h-10 min-w-10 items-center justify-center text-neutral-700 transition hover:text-primary disabled:opacity-35 sm:min-h-11 sm:min-w-11"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={15} />
                        </button>
                        <span className="w-10 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity + 1,
                              item.selectedShade,
                            )
                          }
                          className="flex min-h-10 min-w-10 items-center justify-center text-neutral-700 transition hover:text-primary sm:min-h-11 sm:min-w-11"
                          aria-label="Increase quantity"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-display text-xl font-semibold leading-none text-neutral-950 sm:text-2xl">
                          {formatNPR(item.product.price * item.quantity)}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">
                          {formatNPR(item.product.price)} each
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-[1.5rem] border border-neutral-200 bg-white p-4 shadow-editorial md:rounded-[2.25rem] md:p-6 lg:sticky lg:top-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Order summary
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-neutral-950 md:text-4xl">
              Your total
            </h2>
            <div className="mt-6 space-y-4 border-b border-neutral-200 pb-5">
              <SummaryRow label="Subtotal" value={formatNPR(subtotal)} />
              <SummaryRow
                label="Delivery"
                value={delivery === 0 ? "Free" : formatNPR(delivery)}
              />
              <SummaryRow
                label="Estimated total"
                value={formatNPR(total)}
                strong
              />
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-neutral-600">
              <div className="flex gap-3">
                <ShieldCheck size={18} className="mt-0.5 text-primary" />{" "}
                Authenticity checked before dispatch
              </div>
              <div className="flex gap-3">
                <Gift size={18} className="mt-0.5 text-primary" /> Gift note
                available at checkout
              </div>
              <div className="flex gap-3">
                <Sparkles size={18} className="mt-0.5 text-primary" /> Packed
                carefully in Kathmandu
              </div>
            </div>
            <Link
              href="/checkout"
              onClick={() =>
                trackCheckoutStart({
                  cart_value_npr: subtotal,
                  item_count: itemCount,
                })
              }
              className="mt-7 flex min-h-12 w-full items-center justify-center rounded-full bg-neutral-950 px-6 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-primary"
            >
              Secure checkout
            </Link>
            <p className="mt-4 text-center text-xs leading-5 text-neutral-400">
              Payment options and delivery address are confirmed on the next
              step.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
