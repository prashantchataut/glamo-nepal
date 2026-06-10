import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { IMAGES } from "@/lib/image-library";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-primary-light/30 to-white pt-8 pb-20 lg:pt-20 lg:pb-32">
      {/* Background Decor */}
      <div className="absolute -top-[20%] -right-[10%] z-0 h-[600px] w-[600px] rounded-full bg-primary/10/60 blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-[10%] -left-[10%] z-0 h-[400px] w-[400px] rounded-full bg-brand-accentLight/40 blur-2xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          {/* Text Content */}
          <div className="max-w-2xl text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-accentLight bg-white/90 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary shadow-sm">
              <Sparkles size={14} /> Handpicked Nepali Beauty
            </div>
            
            <h1 className="font-display text-[3.5rem] font-medium leading-[1.05] tracking-[-0.02em] text-neutral-900 sm:text-7xl lg:text-[5.5rem]">
              Clean Beauty
              <span className="mt-2 block italic text-primary">Made Easy.</span>
            </h1>
            
            <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-neutral-500 lg:mx-0">
              Build your daily beauty ritual with authentic skincare, makeup and body essentials curated for Nepal. NPR pricing, local delivery, no guesswork.
            </p>
            
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="/shop"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-neutral-950 px-8 text-xs font-bold uppercase tracking-[0.18em] text-white transition-all duration-300 hover:bg-primary hover:shadow-lg hover:-translate-y-1"
              >
                Shop the Edit <ArrowRight size={16} />
              </Link>
              <Link
                href="/routines"
                className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white px-8 text-xs font-bold uppercase tracking-[0.18em] text-neutral-900 transition-all duration-300 hover:border-primary hover:text-primary"
              >
                View Routines
              </Link>
            </div>
            
            <div className="mt-14 grid grid-cols-2 gap-6 border-t border-neutral-100 pt-8 sm:grid-cols-3">
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary-hover">
                  <ShieldCheck size={18} />
                </div>
                <p className="mt-3 text-sm font-bold text-neutral-900">Authentic</p>
                <p className="mt-1 text-xs text-neutral-400">100% Genuine</p>
              </div>
              <div className="flex flex-col items-center lg:items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary-hover">
                  <Truck size={18} />
                </div>
                <p className="mt-3 text-sm font-bold text-neutral-900">Fast Delivery</p>
                <p className="mt-1 text-xs text-neutral-400">All across Nepal</p>
              </div>
              <div className="hidden flex-col items-center sm:flex lg:items-start">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary-hover">
                  <Sparkles size={18} />
                </div>
                <p className="mt-3 text-sm font-bold text-neutral-900">Curated</p>
                <p className="mt-1 text-xs text-neutral-400">Expert selected</p>
              </div>
            </div>
          </div>

          {/* Visual Composition */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            {/* Main Image */}
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] shadow-hero-image ring-1 ring-white/50">
              <Image
                src={IMAGES.hero.secondary}
                alt="Premium skincare assortment"
                fill
                priority
                className="object-cover transition-transform duration-1000 hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            
            {/* Floating Product Card */}
            <div className="absolute -bottom-6 -left-4 z-20 flex w-72 items-center gap-4 rounded-[2rem] bg-white p-4 shadow-card-hover sm:-left-12 lg:-bottom-10 lg:-left-16">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.2rem] bg-neutral-100">
                <Image
                  src={IMAGES.heroProducts.cosrx}
                  alt="Featured serum"
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary-hover">Best Seller</p>
                <p className="mt-1 font-display text-[1.35rem] font-semibold leading-tight text-neutral-900">Botanical Serum</p>
                <Link 
                  href="/shop" 
                  className="mt-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary-hover transition hover:bg-primary-hover hover:text-white"
                  aria-label="Shop Botanical Serum"
                >
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>


          </div>
        </div>
      </div>
    </section>
  );
}
