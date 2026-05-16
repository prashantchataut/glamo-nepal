import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/image-library";

export function EditorialBanner() {
  return (
    <section aria-labelledby="editorial-banner-heading" className="bg-cream-50 py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid overflow-hidden rounded-[34px] border border-cream-200 bg-brand-blush shadow-[0_28px_90px_-70px_rgba(26,21,18,0.55)] lg:grid-cols-[1fr_0.9fr] lg:items-stretch">
          <div className="px-5 py-8 sm:px-8 md:py-12 lg:p-12">
            <span className="inline-flex rounded-2xl bg-cream-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-brand-rose ring-1 ring-white/80">Curated Beauty Edit</span>
            <h2 id="editorial-banner-heading" className="mt-5 max-w-xl font-display text-4xl font-semibold leading-[0.92] tracking-[-0.04em] text-ink md:text-6xl">
              Beauty that feels calm, useful and shoppable.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-cream-700 md:text-base">
              Gift-ready skincare, soft glam makeup and daily glow essentials curated for Nepal — with clear navigation instead of visual noise.
            </p>
            <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] bg-cream-50 px-5 py-4 ring-1 ring-white/80"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-rose">Best Sellers</p><p className="mt-1 text-sm text-cream-700">Customer favorites for routine building</p></div>
              <div className="rounded-[24px] bg-cream-50/72 px-5 py-4 ring-1 ring-white/80"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-rose">Highlights</p><p className="mt-1 text-sm text-cream-700">SPF · K-beauty · Everyday makeup</p></div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/collections/best-sellers" className="rounded-2xl bg-ink px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-brand-rose">Shop best sellers</Link>
              <Link href="/collections/new-arrivals" className="rounded-2xl border border-neutral-950/15 bg-cream-50/70 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-ink transition hover:border-brand-rose hover:text-brand-rose">Explore new arrivals</Link>
            </div>
          </div>
          <div className="relative min-h-[300px] overflow-hidden bg-cream-50 lg:min-h-full">
            <Image src={IMAGES.editorial.shelf} alt="Premium beauty shelf with skincare and cosmetics" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 42vw" />
          </div>
        </div>
      </div>
    </section>
  );
}
