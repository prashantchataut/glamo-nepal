"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ProductCard } from "@/components/product/ProductCard";
import { trackEvent } from "@/lib/analytics";
import { getReturnEligibility } from "@/lib/product-safety";
import { cn, formatNPR } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import type { Product } from "@/types/product";

const reassurance = [
  {
    label: "Authenticity checked",
    text: "Supplier and batch checks before dispatch.",
    icon: ShieldCheck,
  },
  {
    label: "Nepal delivery",
    text: "Kathmandu Valley usually ships fastest.",
    icon: Truck,
  },
  {
    label: "Simple returns",
    text: "Eligible unopened items follow policy rules.",
    icon: RotateCcw,
  },
];

export default function ProductDetailClient({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const [shade, setShade] = useState(product.shadeOptions?.[0]?.name || "");
  const [quantity, setQuantity] = useState(1);
  const [quantityError, setQuantityError] = useState("");
  const [currentImage, setCurrentImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const wishlist = useWishlistStore();
  const addRecent = useRecentlyViewedStore((s) => s.addItem);
  const isWishlisted = wishlist.isInWishlist(product.id);
  const galleryImages = useMemo(
    () =>
      Array.from(new Set([product.image, ...(product.images || [])])).slice(
        0,
        5,
      ),
    [product],
  );
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;
  const returnEligibility = getReturnEligibility(product);

  useEffect(() => {
    addRecent(product);
    trackEvent("product_viewed", {
      productId: product.id,
      productSlug: product.slug,
      sku: product.sku,
      value: product.price,
    });
  }, [addRecent, product]);

  function addToCart() {
    setQuantityError("");
    if (!product.inStock) {
      toast.error("This product is currently sold out.");
      return;
    }
    const result = addItem(product, quantity, shade || undefined);
    if (!result.ok) {
      setQuantityError(result.message || "Unable to add this item.");
      toast.error(result.message || "Unable to add this item.");
      return;
    }
    window.dispatchEvent(new CustomEvent("glamo:cart-pulse"));
    trackEvent("add_to_cart", {
      productId: product.id,
      productSlug: product.slug,
      sku: product.sku,
      value: product.price,
      shade,
      quantity,
    });
    toast.success(
      `${quantity > 1 ? `${quantity} x ` : ""}${product.name} added to bag`,
    );
    setQuantity(1);
  }

  function toggleWishlist() {
    wishlist.toggleItem(product);
    trackEvent("wishlist_toggle", {
      productId: product.id,
      productSlug: product.slug,
      sku: product.sku,
      action: isWishlisted ? "remove" : "add",
    });
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: product.name,
        text: product.description,
        url,
      });
      return;
    }
    await navigator.clipboard?.writeText(url);
    toast.success("Product link copied");
  }

  function handleZoom(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

  return (
    <main className="bg-cream-50">
      <section className="border-b border-cream-200 bg-brand-blush px-4 py-4 md:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav
            className="flex min-h-10 flex-wrap items-center gap-2 text-sm text-cream-700"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="transition hover:text-brand-rose">
              Home
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
            <Link href="/shop" className="transition hover:text-brand-rose">
              Shop
            </Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="font-medium text-ink">{product.name}</span>
          </nav>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6 md:py-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:gap-14 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[88px_minmax(0,1fr)]">
          <div className="order-2 flex gap-2 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible">
            {galleryImages.map((img, i) => (
              <button
                key={`${img}-${i}`}
                type="button"
                onClick={() => setCurrentImage(i)}
                className={cn(
                  "relative aspect-square w-20 shrink-0 overflow-hidden rounded-none border bg-cream-50 transition-colors",
                  currentImage === i
                    ? "border-brand-rose"
                    : "border-cream-200 hover:border-cream-400",
                )}
                aria-label={`View ${product.name} image ${i + 1}`}
                aria-current={currentImage === i ? "true" : undefined}
              >
                <Image
                  src={img}
                  alt={`${product.name} view ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="88px"
                />
              </button>
            ))}
          </div>

          <div
            className="order-1 relative aspect-[4/5] overflow-hidden rounded-none border border-cream-200 bg-cream-100 shadow-editorial lg:order-2 lg:cursor-zoom-in"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleZoom}
          >
            <Image
              src={galleryImages[currentImage]}
              alt={`${product.brand} ${product.name}`}
              fill
              priority
              className={cn(
                "object-cover transition-transform duration-300",
                isZoomed ? "scale-[1.6]" : "scale-100",
              )}
              style={
                isZoomed
                  ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }
                  : undefined
              }
              sizes="(max-width: 1024px) 100vw, 52vw"
            />
            {discount > 0 && (
              <span className="absolute left-5 top-5 rounded-none bg-cream-50/92 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink ring-1 ring-white/80">
                Save {discount}%
              </span>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-none border border-cream-200 bg-cream-50 p-5 shadow-[0_18px_70px_-54px_rgba(26,21,18,0.55)] md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link
                  href={`/brands/${product.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-rose transition-colors hover:text-brand-rose-dark"
                >
                  {product.brand}
                </Link>
                <h1 className="mt-2 font-display text-5xl font-semibold leading-[0.92] tracking-[-0.04em] text-ink md:text-6xl">
                  {product.name}
                </h1>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleWishlist}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-none border border-cream-200 transition",
                    isWishlisted
                      ? "bg-brand-rose text-white"
                      : "bg-cream-50 text-cream-700 hover:text-brand-rose",
                  )}
                  aria-label={
                    isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                  }
                >
                  <Heart
                    size={18}
                    fill={isWishlisted ? "currentColor" : "none"}
                  />
                </button>
                <button
                  type="button"
                  onClick={share}
                  className="flex h-11 w-11 items-center justify-center rounded-none border border-cream-200 bg-cream-50 text-cream-700 transition hover:text-brand-rose"
                  aria-label="Share product"
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div
                className="flex items-center"
                aria-label={`${product.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={15}
                    fill={
                      i < Math.round(product.rating) ? "currentColor" : "none"
                    }
                    className={
                      i < Math.round(product.rating)
                        ? "text-gold"
                        : "text-cream-300"
                    }
                  />
                ))}
              </div>
              <span className="text-sm text-cream-400">
                {product.rating.toFixed(1)} ({product.reviewsCount} reviews)
              </span>
              <span className="text-sm text-cream-300">/</span>
              <span className="text-sm text-cream-400">{product.size}</span>
            </div>

            <div className="mt-5 flex flex-wrap items-end gap-3">
              <span className="font-display text-4xl font-semibold leading-none text-ink">
                {formatNPR(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-cream-400 line-through">
                  {formatNPR(product.originalPrice)}
                </span>
              )}
              {product.inStock ? (
                <span className="rounded-none bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                  In stock
                </span>
              ) : (
                <span className="rounded-none bg-cream-100 px-3 py-1 text-xs font-semibold text-cream-400">
                  Sold out
                </span>
              )}
            </div>

            <p className="mt-5 text-[15px] leading-8 text-cream-700">
              {product.description.trim()}
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {product.benefits.slice(0, 3).map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-none bg-cream-100 p-3 text-xs font-medium leading-5 text-cream-700 ring-1 ring-neutral-100"
                >
                  {benefit}
                </div>
              ))}
            </div>

            {product.shadeOptions && product.shadeOptions.length > 0 && (
              <div className="mt-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cream-400">
                  Shade: <span className="text-ink">{shade}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.shadeOptions.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setShade(option.name)}
                      className={cn(
                        "flex min-h-11 items-center gap-2 rounded-none border px-4 text-sm transition",
                        shade === option.name
                          ? "border-brand-rose bg-brand-rose text-white"
                          : "border-cream-200 bg-cream-50 text-cream-700 hover:border-brand-rose/40",
                      )}
                      aria-pressed={shade === option.name}
                    >
                      <span
                        className="h-4 w-4 rounded-none border border-white/70 ring-1 ring-neutral-200"
                        style={{ backgroundColor: option.hex || "#E8E4DF" }}
                      />
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div
              ref={ctaRef}
              className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <div className="flex h-12 w-fit items-center rounded-none border border-cream-200 bg-cream-50">
                <button
                  type="button"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-12 w-12 items-center justify-center text-cream-700 transition hover:text-brand-rose disabled:opacity-35"
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <span className="w-10 text-center text-sm font-semibold">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((q) => Math.min(product.stockCount, q + 1))
                  }
                  className="flex h-12 w-12 items-center justify-center text-cream-700 transition hover:text-brand-rose"
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>
              <button
                type="button"
                onClick={addToCart}
                disabled={!product.inStock}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-3 rounded-none bg-ink px-7 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-brand-rose disabled:cursor-not-allowed disabled:bg-neutral-300"
              >
                <ShoppingBag size={16} /> Add to bag
              </button>
            </div>
            {quantityError && (
              <p className="mt-3 text-sm text-error">{quantityError}</p>
            )}

            <div className="mt-6 grid gap-3">
              {reassurance.map(({ label, text, icon: Icon }) => (
                <div
                  key={label}
                  className="flex gap-3 rounded-none border border-cream-200 bg-cream-50 p-4"
                >
                  <Icon size={18} className="mt-0.5 text-brand-rose" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-cream-400">
                      {text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-12 md:px-6 lg:grid-cols-[0.78fr_1.22fr] lg:px-8">
        <div className="rounded-none bg-ink p-6 text-white md:p-8">
          <Sparkles size={22} className="text-brand-blush" />
          <h2 className="mt-5 font-display text-4xl font-semibold leading-none">
            Routine notes
          </h2>
          <p className="mt-4 text-sm leading-7 text-white/70">
            Designed to help shoppers decide quickly without fake urgency. Pair
            with SPF in the morning and patch test active formulas when needed.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {product.concernTags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-none bg-cream-50/10 px-3 py-1.5 text-xs text-white/80"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-none border border-cream-200 bg-cream-50 p-5 md:p-7">
          <Accordion
            type="single"
            collapsible
            defaultValue="details"
            className="w-full"
          >
            <AccordionItem value="details">
              <AccordionTrigger>Product details</AccordionTrigger>
              <AccordionContent>
                <dl className="grid gap-3 text-sm text-cream-700 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-ink">Origin</dt>
                    <dd>{product.origin}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">Size</dt>
                    <dd>{product.size}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">
                      Skin type
                    </dt>
                    <dd>{product.skinType.join(", ")}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-ink">SKU</dt>
                    <dd>{product.sku}</dd>
                  </div>
                </dl>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="how-to-use">
              <AccordionTrigger>How to use</AccordionTrigger>
              <AccordionContent>
                <ol className="space-y-2 text-sm leading-7 text-cream-700">
                  {product.howToUse.map((step) => (
                    <li key={step}>- {step}</li>
                  ))}
                </ol>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ingredients">
              <AccordionTrigger>Ingredients spotlight</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {product.ingredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="rounded-none bg-cream-100 px-3 py-1.5 text-sm text-cream-700"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping">
              <AccordionTrigger>Delivery & returns</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-7 text-cream-700">
                  {product.deliveryNote ||
                    "Delivery fees and timelines are calculated at checkout based on district."}
                </p>
                <p className="mt-3 text-sm leading-7 text-cream-700">
                  {returnEligibility}
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-rose">
                Complete the shelf
              </p>
              <h2 className="mt-2 font-display text-4xl font-semibold tracking-[-0.03em] text-ink">
                You may also like
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden text-sm font-semibold text-cream-700 hover:text-brand-rose md:inline"
            >
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
