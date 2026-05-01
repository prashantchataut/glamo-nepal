"use client";

import Image from "next/image";
import { BRAND_LOGOS } from "@/lib/constants";

export function BrandsMarquee() {
  const doubled = [...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS, ...BRAND_LOGOS];

  return (
    <section className="py-14 md:py-20 bg-white border-y border-border/30 overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 mb-10 text-center">
        <p className="text-brand-textMuted text-xs md:text-sm uppercase tracking-[0.25em] font-bold">
          Trusted by the finest brands
        </p>
      </div>
      <div className="flex whitespace-nowrap">
        <div className="animate-marquee-scroll flex items-center gap-16 md:gap-24 px-8">
          {doubled.map((brand, i) => (
            <div key={`brand-${i}`} className="flex-shrink-0 flex items-center justify-center opacity-40 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500">
              <Image
                src={brand.image}
                alt={brand.name}
                width={120}
                height={40}
                className="h-8 md:h-10 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}