import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { IMAGES } from "@/lib/image-library";

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden pt-6 pb-16 lg:pt-16 lg:pb-28" style={{ background: "linear-gradient(170deg, #FFF7F5 0%, #FDF0F4 40%, #FAFAF9 100%)" }}>
      <div className="relative z-10 mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div className="max-w-xl lg:max-w-none">
            <h1 className="font-display text-[2.75rem] font-medium leading-[1.05] tracking-[-0.03em] text-neutral-900 sm:text-6xl lg:text-[5.5rem]">
              Your beauty ritual, delivered.
            </h1>
            <p className="mt-6 max-w-md text-[1.0625rem] leading-[1.7] text-neutral-500 lg:mt-8 lg:max-w-lg">
              Authentic skincare, makeup and body essentials curated for Kathmandu. NPR pricing, local delivery, no guesswork.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/shop"
                className="inline-flex h-[52px] items-center justify-center gap-2.5 rounded-full bg-neutral-950 px-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition-colors duration-200 hover:bg-primary"
              >
                Shop the edit <ArrowRight size={15} strokeWidth={2} />
              </Link>
              <Link
                href="/routines"
                className="inline-flex h-[52px] items-center justify-center rounded-full border border-neutral-200 bg-white px-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-800 transition-colors duration-200 hover:border-primary hover:text-primary"
              >
                View routines
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] shadow-hero-image">
              <Image
                src={IMAGES.hero.secondary}
                alt="Premium skincare assortment for Kathmandu delivery"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 46vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
