"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Image from "next/image";
import Link from "next/link";
import { MoveRight } from "lucide-react";
import { PROMO_BANNERS } from "@/lib/constants";

export function PromoBannerGrid() {
  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {PROMO_BANNERS.map((banner) => (
            <div key={banner.id} className="relative group overflow-hidden rounded-[2rem] aspect-[4/3] md:aspect-auto md:h-[500px]">
              <Image
                src={banner.image}
                alt={banner.title}
                fill
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${banner.gradient} flex flex-col justify-end p-8 md:p-12`}>
                <span className="text-white/70 uppercase tracking-[0.2em] text-[10px] md:text-xs font-bold mb-3">{banner.tag}</span>
                <h3 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white mb-3 leading-tight">{banner.title}</h3>
                <p className="text-white/80 text-sm md:text-base mb-6 max-w-sm">{banner.subtitle}</p>
                <Link href={banner.ctaLink} className="inline-flex items-center gap-3 bg-white text-brand-bgDark w-fit px-6 py-3 rounded-full font-semibold text-sm hover:bg-brand-secondary hover:text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                  {banner.cta} <MoveRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}