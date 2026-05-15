import Image from "next/image";
import { BRAND_LOGOS } from "@/lib/constants";

export function BrandsMarquee() {
  return (
    <section
      className="py-10 md:py-16 bg-white border-y border-border/30"
      aria-labelledby="brands-marquee-heading"
    >
      <div className="container mx-auto px-4 md:px-6">
        <p id="brands-marquee-heading" className="text-center font-label text-brand-textMuted text-xs md:text-sm uppercase tracking-[0.25em] font-bold mb-6 md:mb-8">
          Trusted by the finest brands
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6 items-center">
          {BRAND_LOGOS.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center justify-center opacity-60 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-300"
            >
              <Image
                src={brand.image}
                alt={brand.name}
                width={120}
                height={40}
                loading="lazy"
                className="h-8 md:h-10 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}