import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/image-library";

export function EditorialBanner() {
  return (
    <section aria-labelledby="editorial-banner-heading" className="bg-brand-bgLight py-12 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid overflow-hidden rounded-[34px] border border-neutral-200 bg-brand-surfacePink shadow-editorial lg:grid-cols-[1fr_0.9fr] lg:items-stretch">
          <div className="px-5 py-8 sm:px-8 md:py-12 lg:p-12">
            <span className="inline-flex rounded-full bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary ring-1 ring-white/80">Curated Beauty Edit</span>
            <h2 id="editorial-banner-heading" className="mt-5 max-w-xl font-display text-4xl font-semibold leading-[0.92] tracking-[-0.04em] text-neutral-950 md:text-6xl">
              Beauty that feels calm, useful and shoppable.
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-neutral-700 md:text-base">
              Gift-ready skincare, soft glam makeup and daily glow essentials curated for Nepal — with clear navigation instead of visual noise.
            </p>
            <div className="mt-7 grid max-w-xl gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] bg-white px-5 py-4 ring-1 ring-white/80"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Best Sellers</p><p className="mt-1 text-sm text-neutral-600">Customer favorites for routine building</p></div>
              <div className="rounded-[24px] bg-white/72 px-5 py-4 ring-1 ring-white/80"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Highlights</p><p className="mt-1 text-sm text-neutral-600">SPF · K-beauty · Everyday makeup</p></div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/collections/best-sellers" className="rounded-full bg-neutral-950 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:bg-primary">Shop best sellers</Link>
              <Link href="/collections/new-arrivals" className="rounded-full border border-neutral-950/15 bg-white/70 px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-neutral-950 transition hover:border-primary hover:text-primary">Explore new arrivals</Link>
            </div>
          </div>
          <div className="relative min-h-[300px] overflow-hidden bg-white lg:min-h-full">
            <Image src={IMAGES.editorial.shelf} alt="Premium beauty shelf with skincare and cosmetics" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 42vw" />
          </div>
        </div>
      </div>
    </section>
  );
}
