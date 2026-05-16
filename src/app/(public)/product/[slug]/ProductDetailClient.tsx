"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck, RotateCcw, Share2, Heart } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProductCard } from "@/components/product/ProductCard";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";
import { trackEvent } from "@/lib/analytics";
import { getReturnEligibility } from "@/lib/product-safety";
import { cn, formatNPR } from "@/lib/utils";
import type { Product } from "@/types/product";

export default function ProductDetailClient({ product, related }: { product: Product; related: Product[] }) {
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
  const galleryImages = useMemo(() => Array.from(new Set([product.image, ...(product.images || [])])).slice(0, 5), [product]);
  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;

  useEffect(() => {
    addRecent(product);
    trackEvent("product_viewed", { productId: product.id, productSlug: product.slug, sku: product.sku, value: product.price });
  }, [addRecent, product]);

  function addToCart() {
    setQuantityError("");
    if (!product.inStock) { toast.error("This product is currently sold out."); return; }
    const result = addItem(product, quantity, shade || undefined);
    if (!result.ok) { setQuantityError(result.message || "Unable to add this item."); toast.error(result.message || "Unable to add this item."); return; }
    window.dispatchEvent(new CustomEvent("glamo:cart-pulse"));
    trackEvent("add_to_cart", { productId: product.id, productSlug: product.slug, sku: product.sku, value: product.price, shade, quantity });
    toast.success(`${quantity > 1 ? `${quantity} × ` : ""}${product.name} added to cart`);
    setQuantity(1);
  }

  function toggleWishlist() {
    wishlist.toggleItem(product);
    trackEvent("wishlist_toggle", { productId: product.id, productSlug: product.slug, sku: product.sku, action: isWishlisted ? "remove" : "add" });
  }

  async function share() {
    const url = window.location.href;
    if (navigator.share) { await navigator.share({ title: product.name, text: product.description, url }); }
    else { await navigator.clipboard?.writeText(url); toast.success("Product link copied"); }
  }

  function handleZoom(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

  return (
    <div className="bg-[#fbfaf8]">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-5 md:px-6 lg:px-8">
        <nav className="flex min-h-11 flex-wrap items-center gap-2 text-sm text-neutral-500" aria-label="Breadcrumb">
          <Link href="/" className="transition hover:text-primary">Home</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <Link href="/shop" className="transition hover:text-primary">Shop</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span className="font-medium text-neutral-800">{product.name}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[55fr_45fr] lg:gap-12">
          {/* Left: Image Gallery */}
          <div className="flex flex-col-reverse lg:flex-row gap-4">
            {/* Thumbnails (vertical on desktop) */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[600px] no-scrollbar">
              {galleryImages.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setCurrentImage(i)}
                  className={cn(
                    "relative aspect-square w-16 shrink-0 overflow-hidden border bg-neutral-100 transition-colors cursor-pointer lg:w-20",
                    currentImage === i ? "border-primary" : "border-neutral-200 hover:border-neutral-400"
                  )}
                  aria-label={`View ${product.name} image ${i + 1}`}
                  aria-current={currentImage === i ? "true" : undefined}
                >
                  <Image src={img} alt={`${product.name} view ${i + 1}`} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>

            {/* Main image */}
            <div
              className="relative aspect-[4/5] overflow-hidden border border-neutral-200 bg-white cursor-zoom-in hidden lg:block shadow-sm"
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
                  isZoomed ? "scale-[1.8]" : "scale-100"
                )}
                style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
                sizes="55vw"
              />
              {/* Mobile: no zoom, just scrollable */}
            </div>

            {/* Mobile: simple image carousel */}
            <div className="relative aspect-[4/5] overflow-hidden border border-neutral-200 bg-white lg:hidden shadow-sm">
              <Image
                src={galleryImages[currentImage]}
                alt={`${product.brand} ${product.name}`}
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
              {galleryImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {galleryImages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentImage(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all cursor-pointer",
                        i === currentImage ? "w-6 bg-white" : "w-1.5 bg-white/50"
                      )}
                      aria-label={`Go to image ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="border border-neutral-200 bg-white p-5 shadow-sm md:p-7 lg:sticky lg:top-24 lg:self-start">
            {/* Brand */}
            <Link href={`/brands/${product.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="type-label text-[11px] text-primary hover:text-primary-dark transition-colors">
              {product.brand}
            </Link>

            {/* Name */}
            <h1 className="type-display-md text-neutral-900 mt-2">{product.name}</h1>

            {/* Rating */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center" aria-label={`${product.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill={i < Math.round(product.rating) ? "currentColor" : "none"} className={i < Math.round(product.rating) ? "text-secondary" : "text-neutral-300"} />
                ))}
              </div>
              <span className="type-body-sm text-neutral-400">({product.reviewsCount})</span>
              <a href="#reviews" className="type-body-sm text-primary hover:underline ml-1">Read Reviews</a>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3">
              <span className="type-price text-neutral-900">{formatNPR(product.price)}</span>
              {product.originalPrice && (
                <>
                  <span className="font-body text-sm text-neutral-400 line-through">{formatNPR(product.originalPrice)}</span>
                  {discount > 0 && <span className="bg-secondary text-white text-[10px] tracking-widest uppercase px-2 py-0.5 font-medium">-{discount}%</span>}
                </>
              )}
            </div>

            {/* Divider */}
            <div className="mt-6 border-t border-neutral-200" />

            {/* Description */}
            <p className="type-body-md text-neutral-600 mt-5 leading-7">{product.description.trim()}</p>

            {/* Shade selector */}
            {product.shadeOptions && product.shadeOptions.length > 0 && (
              <div className="mt-6">
                <p className="type-label text-[11px] text-neutral-400 mb-3">Shade: {shade}</p>
                <div className="flex flex-wrap gap-2">
                  {product.shadeOptions.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setShade(option.name)}
                      className={cn(
                        "px-3 py-1.5 text-xs tracking-wide transition-colors cursor-pointer",
                        shade === option.name
                          ? "bg-primary text-white"
                          : "bg-neutral-100 text-neutral-600 hover:text-primary"
                      )}
                    >
                      {option.hex && (
                        <span className="inline-block h-2 w-2 rounded-full mr-1.5 align-middle border border-neutral-200" style={{ backgroundColor: option.hex }} />
                      )}
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div ref={ctaRef} className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              {product.inStock && (
                <div className="flex items-center border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="flex h-11 w-11 items-center justify-center text-neutral-700 transition-colors hover:text-primary disabled:opacity-40 cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex h-11 w-11 items-center justify-center text-neutral-700 transition-colors hover:text-primary cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
              <button
                onClick={addToCart}
                disabled={!product.inStock}
                className="flex min-h-12 flex-1 items-center justify-center gap-2 bg-primary px-8 text-[13px] font-medium tracking-[0.12em] uppercase text-white transition-colors hover:bg-primary-dark disabled:bg-neutral-400 disabled:cursor-not-allowed cursor-pointer"
              >
                <ShoppingBag size={16} />
                {product.inStock ? "Add to Bag" : "Sold Out"}
              </button>
              <button
                type="button"
                onClick={toggleWishlist}
                className={cn(
                  "flex min-h-12 min-w-12 items-center justify-center border border-neutral-200 transition-colors cursor-pointer",
                  isWishlisted ? "bg-primary text-white border-primary" : "text-neutral-700 hover:text-primary"
                )}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
              </button>
            </div>

            {quantityError && (
              <p className="mt-3 text-sm text-error" role="alert">{quantityError}</p>
            )}

            {/* Trust row */}
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="border border-neutral-200 bg-neutral-50 p-3 text-center">
                <Truck size={18} className="mx-auto text-primary" />
                <p className="type-label text-[10px] text-neutral-400 mt-1">Free Shipping</p>
                <p className="type-body-sm text-neutral-700">Over रू 2,000</p>
              </div>
              <div className="border border-neutral-200 bg-neutral-50 p-3 text-center">
                <ShieldCheck size={18} className="mx-auto text-primary" />
                <p className="type-label text-[10px] text-neutral-400 mt-1">Authentic</p>
                <p className="type-body-sm text-neutral-700">Guaranteed</p>
              </div>
              <div className="border border-neutral-200 bg-neutral-50 p-3 text-center">
                <RotateCcw size={18} className="mx-auto text-primary" />
                <p className="type-label text-[10px] text-neutral-400 mt-1">7-Day Returns</p>
                <p className="type-body-sm text-neutral-700">{getReturnEligibility(product)}</p>
              </div>
            </div>

            {/* Accordion: Details */}
            <div className="mt-8 border-y border-neutral-200">
              <Accordion type="single" collapsible>
                <AccordionItem value="details">
                  <AccordionTrigger className="type-label text-[11px] text-neutral-900 py-4 hover:no-underline">Details</AccordionTrigger>
                  <AccordionContent>
                    <div className="type-body-sm text-neutral-700 space-y-2 pb-4">
                      <p><strong>Size:</strong> {product.size}</p>
                      <p><strong>Origin:</strong> {product.origin}</p>
                      {product.madeInNepal && <p><strong>Made in Nepal</strong></p>}
                      <p><strong>SKU:</strong> {product.sku}</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="ingredients">
                  <AccordionTrigger className="type-label text-[11px] text-neutral-900 py-4 hover:no-underline">Ingredients</AccordionTrigger>
                  <AccordionContent>
                    <ul className="type-body-sm text-neutral-700 space-y-1 pb-4">
                      {product.ingredients.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-secondary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="how-to-use">
                  <AccordionTrigger className="type-label text-[11px] text-neutral-900 py-4 hover:no-underline">How to Use</AccordionTrigger>
                  <AccordionContent>
                    <ol className="type-body-sm text-neutral-700 space-y-2 pb-4 list-de list-inside">
                      {product.howToUse.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="shipping">
                  <AccordionTrigger className="type-label text-[11px] text-neutral-900 py-4 hover:no-underline">Shipping & Returns</AccordionTrigger>
                  <AccordionContent>
                    <div className="type-body-sm text-neutral-700 space-y-2 pb-4">
                      <p>Free delivery on orders over रू 2,000.</p>
                      <p>Valley delivery: 1-2 business days.</p>
                      <p>Outside Valley: 3-5 business days.</p>
                      <p>Returns accepted within 7 days of delivery.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Share */}
            <button
              type="button"
              onClick={share}
              className="mt-4 type-body-sm text-neutral-400 hover:text-primary transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Share2 size={14} />
              Share this product
            </button>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="section-padding page-padding bg-white border-t border-neutral-200">
          <div className="mx-auto max-w-7xl">
            <span className="type-label text-[11px] text-neutral-400 mb-3 block">You Might Also Like</span>
            <h2 className="type-display-md text-neutral-900">Related Products</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {related.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}