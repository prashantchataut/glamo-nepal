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
      <main className="bg-[#fffaf7] py-12 page-padding">
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
      <main className="min-h-[72vh] bg-[#fffaf7] px-4 py-20 md:py-28">
        <div className="mx-auto max-w-2xl rounded-[2.5rem] border border-neutral-200 bg-white p-8 text-center shadow-editorial md:p-12">
          <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-[#f6e6f4] text-primary">
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
      </main>
    );
  }

  return (
    <main className="bg-[#fffaf7] py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <Link
          href="/shop"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-neutral-500 transition hover:text-primary"
        >
          <ArrowLeft size={16} /> Continue shopping
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_410px] lg:items-start">
          <section>
            <div className="rounded-[2.25rem] border border-neutral-200 bg-white p-5 shadow-[0_18px_70px_-56px_rgba(26,21,18,0.55)] md:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                Shopping bag
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <h1 className="font-display text-5xl font-semibold leading-none tracking-[-0.05em] text-neutral-950 md:text-6xl">
                  Ready for checkout
                </h1>
                <p className="text-sm text-neutral-500">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </p>
              </div>
              <div className="mt-7 rounded-[1.5rem] border border-neutral-200 bg-[#fffaf7] p-4">
                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <Truck size={18} className="text-primary" />{" "}
                  {remainingForFreeDelivery === 0
                    ? "You have unlocked free delivery."
                    : `${formatNPR(remainingForFreeDelivery)} away from free delivery.`}
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {items.map((item) => (
                <article
                  key={`${item.product.id}-${item.selectedShade || "base"}`}
                  className="grid grid-cols-[104px_minmax(0,1fr)] gap-4 rounded-[2rem] border border-neutral-200 bg-white p-4 shadow-[0_18px_60px_-52px_rgba(26,21,18,0.45)] sm:grid-cols-[136px_minmax(0,1fr)] sm:gap-6 sm:p-5"
                >
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-[#f8f0ec]"
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
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                          {item.product.brand}
                        </p>
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="mt-1 block font-display text-2xl font-semibold leading-none tracking-[-0.03em] text-neutral-950 transition hover:text-primary"
                        >
                          {item.product.name}
                        </Link>
                        {item.selectedShade ? (
                          <p className="mt-2 text-sm text-neutral-500">
                            Shade: {item.selectedShade}
                          </p>
                        ) : null}
                      </div>
                      <button
                        onClick={() =>
                          removeItem(item.product.id, item.selectedShade)
                        }
                        className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-400 transition hover:bg-neutral-100 hover:text-error"
                        aria-label={`Remove ${item.product.name}`}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                          className="flex min-h-11 min-w-11 items-center justify-center text-neutral-700 transition hover:text-primary disabled:opacity-35"
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
                          className="flex min-h-11 min-w-11 items-center justify-center text-neutral-700 transition hover:text-primary"
                          aria-label="Increase quantity"
                        >
                          <Plus size={15} />
                        </button>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="font-display text-2xl font-semibold leading-none text-neutral-950">
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

          <aside className="rounded-[2.25rem] border border-neutral-200 bg-white p-6 shadow-editorial lg:sticky lg:top-24">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Order summary
            </p>
            <h2 className="mt-2 font-display text-4xl font-semibold tracking-[-0.04em] text-neutral-950">
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
