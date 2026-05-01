"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Copy, Gift, RotateCcw, Share2, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductBundleCard } from "@/components/product/ProductBundleCard";
import { NotifyMeForm } from "@/components/product/NotifyMeForm";
import { RecentlyViewedStrip } from "@/components/product/RecentlyViewedStrip";
import { useCartStore, type Product } from "@/store/useCartStore";
import { useRecentlyViewedStore } from "@/store/useRecentlyViewedStore";
import { trackEvent } from "@/lib/analytics";
import { getRecommendedBundles } from "@/lib/data/bundles";
import { getAuthenticityNote, getBatchExpiryNote, getPatchTestNote, getReturnEligibility } from "@/lib/product-safety";
import { cn, formatNpr } from "@/lib/utils";

export default function ProductDetailClient({ product, related }: { product: Product; related: Product[] }) {
  const [shade, setShade] = useState(product.shadeOptions?.[0]?.name || "");
  const [showSticky, setShowSticky] = useState(false);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const addRecent = useRecentlyViewedStore((s) => s.addItem);
  const recommendedBundles = getRecommendedBundles(product, 2);
  const customerDescription = product.description.trim();

  useEffect(() => {
    addRecent(product);
    trackEvent("product_viewed", { productId: product.id, productSlug: product.slug, sku: product.sku, value: product.price });
  }, [addRecent, product]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setShowSticky(!entry.isIntersecting), { threshold: 0.2 });
    if (ctaRef.current) observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  const addToCart = () => {
    if (!product.inStock) { toast.error("This product is currently sold out."); return; }
    addItem(product, 1, shade || undefined);
    trackEvent("add_to_cart", { productId: product.id, productSlug: product.slug, sku: product.sku, value: product.price, shade });
    toast.success(`${product.name} added to cart`);
  };
  const copySku = async () => { await navigator.clipboard?.writeText(product.sku); toast.success("SKU copied"); };
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: product.name, text: product.description, url });
    else { await navigator.clipboard?.writeText(url); toast.success("Product link copied"); }
  };

  return (
    <div className="bg-brand-bgLight">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <nav className="mb-6 text-sm text-brand-textMuted"><Link href="/" className="hover:text-brand-primary">Home</Link> / <Link href="/shop" className="hover:text-brand-primary">Shop</Link> / <span>{product.name}</span></nav>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="group relative aspect-square overflow-hidden rounded-[2rem] bg-white shadow-sm"><Image src={product.image} alt={product.name} fill priority className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 1024px) 100vw, 50vw" /></div>
            <div className="grid grid-cols-3 gap-3">{product.images?.slice(0,3).map((img, i) => <div key={i} className="relative aspect-square overflow-hidden rounded-2xl bg-white"><Image src={img} alt={`${product.name} view ${i+1}`} fill className="object-cover" /></div>)}</div>
          </div>
          <div className="lg:sticky lg:top-[calc(var(--total-header-height)+24px)] lg:self-start">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">{product.brand}</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-brand-textPrimary md:text-5xl">{product.name}</h1>
            <div className="mt-3 flex items-center gap-2 text-brand-gold">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill={i < Math.round(product.rating) ? "currentColor" : "none"} />)}<span className="text-sm text-brand-textMuted">{product.rating} · {product.reviewsCount} reviews</span></div>
            <p className="mt-5 text-lg leading-relaxed text-brand-textMuted">{customerDescription}</p>
            <div className="mt-5 flex flex-wrap gap-2">{product.madeInNepal && <span className="rounded-full bg-brand-primary px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-white">Made in Nepal</span>}{product.concernTags.map((tag) => <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-primary">{tag}</span>)}</div>
            <div className="mt-6 flex items-end gap-3"><span className="font-serif text-4xl font-semibold text-brand-gold">{formatNpr(product.price)}</span>{product.originalPrice && <span className="pb-1 text-brand-textMuted line-through">{formatNpr(product.originalPrice)}</span>}</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-brand-textMuted"><p><strong className="text-brand-textPrimary">Size:</strong> {product.size}</p><p><strong className="text-brand-textPrimary">Origin:</strong> {product.origin}</p><p><strong className="text-brand-textPrimary">Stock:</strong> {product.stockCount} units</p><button onClick={copySku} className="flex items-center gap-1 text-left font-semibold text-brand-primary"><Copy size={14} /> {product.sku}</button></div>
            {product.shadeOptions?.length ? <div className="mt-6"><p className="mb-3 text-sm font-semibold text-brand-textPrimary">Shade: {shade}</p><div className="flex flex-wrap gap-2">{product.shadeOptions.map((option) => <button key={option.name} onClick={() => setShade(option.name)} className={cn("rounded-full border px-4 py-2 text-sm font-semibold", shade === option.name ? "border-brand-primary bg-brand-primary text-white" : "border-border bg-white text-brand-textMuted")}>{option.hex && <span className="mr-2 inline-block h-3 w-3 rounded-full align-middle" style={{ backgroundColor: option.hex }} />} {option.name}</button>)}</div></div> : null}
            {!product.inStock ? <div className="mt-7"><NotifyMeForm productName={product.name} /></div> : null}
            <div ref={ctaRef} className="mt-7 flex flex-col gap-3 sm:flex-row"><button onClick={addToCart} disabled={!product.inStock} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand-primary px-7 py-4 font-semibold text-white shadow-lg shadow-brand-primary/20 transition hover:bg-brand-bgDark disabled:cursor-not-allowed disabled:bg-brand-textMuted"><ShoppingBag size={18} /> Add to cart</button><button onClick={share} className="flex items-center justify-center gap-2 rounded-full border border-brand-primary px-7 py-4 font-semibold text-brand-primary hover:bg-white"><Share2 size={18} /> Share</button></div>
            <Dialog><DialogTrigger asChild><button className="mt-3 text-sm font-semibold text-brand-primary underline underline-offset-4">Open size guide</button></DialogTrigger><DialogContent><DialogHeader><DialogTitle className="font-serif text-2xl">GLAMO size guide</DialogTitle></DialogHeader><div className="space-y-3 text-sm text-brand-textMuted"><p>Use this guide for product-specific size, shade and usage guidance.</p><p>Skincare sizes are listed in ml/g. Makeup shade availability is shown per variant when data is connected.</p></div></DialogContent></Dialog>
            <div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white p-4"><Truck className="mb-2 text-brand-primary" /><p className="font-semibold">Delivery</p><p className="text-xs text-brand-textMuted">Valley estimate 1-2 days</p></div><div className="rounded-2xl bg-white p-4"><RotateCcw className="mb-2 text-brand-primary" /><p className="font-semibold">Returns</p><p className="text-xs text-brand-textMuted">{getReturnEligibility(product)}</p></div><div className="rounded-2xl bg-white p-4"><ShieldCheck className="mb-2 text-brand-primary" /><p className="font-semibold">Authenticity</p><p className="text-xs text-brand-textMuted">{getAuthenticityNote(product)}</p></div></div>
          </div>
        </div>
        <section className="mt-12 md:mt-16 grid gap-6 lg:grid-cols-3"><Info title="Benefits" items={product.benefits} /><Info title="How to use" items={product.howToUse} /><Info title="Ingredients" items={product.ingredients} /></section>
        <section className="mt-12 md:mt-16 grid gap-4 rounded-[2rem] border border-amber-300/60 bg-amber-50 p-6 text-sm text-amber-900 md:grid-cols-3"><div><strong>Patch test:</strong><p className="mt-1 leading-6">{getPatchTestNote(product)}</p></div><div><strong>Batch/expiry:</strong><p className="mt-1 leading-6">{getBatchExpiryNote(product)}</p></div><div><strong>Final approval:</strong><p className="mt-1 leading-6">Always check packaging details, expiry date and usage directions before applying.</p></div></section>
        <section className="mt-12 md:mt-16 rounded-[2rem] bg-white p-6"><h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Product FAQ</h2><Accordion type="single" collapsible className="mt-4"><AccordionItem value="delivery"><AccordionTrigger>Can I pay with Cash on Delivery?</AccordionTrigger><AccordionContent>COD availability depends on district and courier rules. The checkout page shows availability based on your delivery district.</AccordionContent></AccordionItem><AccordionItem value="photo"><AccordionTrigger>Can I upload a photo review?</AccordionTrigger><AccordionContent><div className="rounded-2xl border border-dashed border-brand-secondary/40 bg-brand-bgLight p-4 text-brand-textMuted"><Gift className="mb-2" /> Photo review upload is coming soon. For now, share feedback with GLAMO on WhatsApp or Instagram.</div></AccordionContent></AccordionItem><AccordionItem value="claims"><AccordionTrigger>Are product claims final?</AccordionTrigger><AccordionContent>Product details are curated carefully. Please check packaging and contact GLAMO if you need clarification before use.</AccordionContent></AccordionItem></Accordion></section>
        <section className="mt-12 md:mt-16"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Routine pairings</p><h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Routine-friendly recommendations</h2></div><div className="grid gap-6 md:grid-cols-2">{recommendedBundles.map((bundle) => <ProductBundleCard key={bundle.slug} bundle={bundle} compact />)}</div></section>
        <section className="mt-12 md:mt-16"><div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">More to explore</p><h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Related products</h2></div><div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div></section>
      </div>
      <RecentlyViewedStrip excludeSlug={product.slug} />
      <div className={cn("fixed inset-x-0 bottom-16 md:bottom-0 z-50 border-t border-brand-secondary/20 bg-white/95 p-3 shadow-2xl backdrop-blur transition-transform md:hidden", showSticky ? "translate-y-0" : "translate-y-full")}><div className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="line-clamp-1 font-semibold text-brand-textPrimary">{product.name}</p><p className="text-brand-gold">{formatNpr(product.price)}</p></div><button onClick={addToCart} className="rounded-full bg-brand-primary px-5 py-3 font-semibold text-white">Add</button></div></div>
    </div>
  );
}

function Info({ title, items }: { title: string; items: string[] }) { return <div className="rounded-[2rem] bg-white p-6"><h2 className="font-serif text-2xl font-semibold text-brand-textPrimary">{title}</h2><ul className="mt-4 space-y-3 text-sm text-brand-textMuted">{items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand-gold" />{item}</li>)}</ul></div>; }