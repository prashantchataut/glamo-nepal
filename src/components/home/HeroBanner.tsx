"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO_SLIDES } from "@/lib/constants";

export function HeroBanner() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 6500, stopOnInteraction: false })]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section className="border-b border-border/60 bg-[#FBF7F8]">
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_80px_-50px_rgba(56,26,44,0.35)] ring-1 ring-black/5">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex">
              {HERO_SLIDES.map((slide, index) => (
                <div key={slide.id} className="min-w-0 flex-[0_0_100%]">
                  <div className={cn("grid min-h-[560px] items-center gap-10 px-6 py-10 md:grid-cols-[1.05fr_0.95fr] md:px-12 md:py-12 lg:min-h-[620px] lg:px-16", slide.bgColor)}>
                    <div className="relative z-10 order-2 md:order-1 max-w-xl">
                      <span className="inline-flex rounded-full bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary ring-1 ring-brand-primary/10 backdrop-blur">
                        {slide.annotation}
                      </span>
                      <h1 className="mt-6 font-serif text-[clamp(2.5rem,6vw,5.5rem)] font-semibold leading-[0.95] text-brand-textPrimary">
                        <span className="block">{slide.title1}</span>
                        <span className="mt-2 block italic text-brand-primary">{slide.title2}</span>
                      </h1>
                      <p className="mt-6 max-w-lg text-base leading-7 text-brand-textMuted md:text-lg">{slide.subtitle}</p>
                      <div className="mt-8 flex flex-wrap items-center gap-4">
                        <Link href={slide.ctaLink} className="inline-flex items-center justify-center rounded-full bg-brand-primary px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-bgDark">
                          {slide.cta}
                        </Link>
                        <Link href="/shop" className="inline-flex items-center justify-center rounded-full border border-brand-textPrimary/15 bg-white/70 px-7 py-3.5 text-sm font-semibold text-brand-textPrimary transition hover:border-brand-primary hover:text-brand-primary">
                          Browse all products
                        </Link>
                      </div>
                      <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 text-left">
                        {[
                          ["NPR pricing", "Easy local shopping"],
                          ["Authentic picks", "Curated beauty edits"],
                          ["Delivery across Nepal", "Valley-friendly service"],
                        ].map(([title, body]) => (
                          <div key={title} className="rounded-2xl bg-white/70 px-4 py-4 ring-1 ring-black/5 backdrop-blur">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary">{title}</p>
                            <p className="mt-2 text-xs leading-5 text-brand-textMuted">{body}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="relative z-10 order-1 md:order-2 flex items-center justify-center">
                      <div className="pointer-events-none absolute inset-x-10 top-8 h-20 rounded-full bg-white/50 blur-2xl" />
                      <div className="relative aspect-[4/4.8] w-full max-w-[460px] overflow-hidden rounded-[2rem] bg-white/60 p-3 ring-1 ring-black/5">
                        <div className="absolute left-6 top-6 z-10 rounded-full bg-brand-gold px-4 py-2 text-sm font-semibold text-brand-bgDark shadow-sm">
                          Up to 30% OFF
                        </div>
                        <div className="absolute bottom-6 left-6 z-10 max-w-[220px] rounded-[1.5rem] bg-white/92 px-5 py-4 shadow-lg ring-1 ring-black/5 backdrop-blur">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">GLAMO edit</p>
                          <p className="mt-2 font-serif text-2xl font-semibold text-brand-textPrimary">New Year 2083</p>
                          <p className="mt-1 text-sm leading-6 text-brand-textMuted">Celebrate with skin-loving essentials, makeup heroes and giftable beauty picks.</p>
                        </div>
                        <div className="relative h-full overflow-hidden rounded-[1.5rem] bg-white">
                          <Image
                            src={slide.image}
                            alt={`${slide.title1} ${slide.title2}`}
                            fill
                            priority={index === 0}
                            className="object-cover"
                            sizes="(max-width: 768px) 90vw, 42vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-brand-bgDark/10 via-transparent to-white/10" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-black/5 bg-white px-6 py-4 md:px-12">
            <div className="flex items-center gap-2">
              {HERO_SLIDES.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => emblaApi?.scrollTo(index)}
                  aria-label={`Go to ${slide.annotation}`}
                  className={cn(
                    "flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0",
                    index === selectedIndex
                      ? "w-10 bg-brand-primary h-2 rounded-full transition-all duration-300 md:h-2 md:w-10"
                      : "w-2 h-2 rounded-full bg-brand-primary/25 transition-all duration-300 hover:bg-brand-primary/45 md:h-2 md:w-2"
                  )}
                >
                  <span className={cn(
                    "rounded-full transition-all duration-300",
                    index === selectedIndex ? "h-2 w-10 bg-brand-primary" : "h-2 w-2 bg-brand-primary/25"
                  )} />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={scrollPrev} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-textPrimary/10 text-brand-textPrimary transition hover:border-brand-primary hover:text-brand-primary" aria-label="Previous slide">
                <ChevronLeft size={18} />
              </button>
              <button onClick={scrollNext} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-textPrimary/10 text-brand-textPrimary transition hover:border-brand-primary hover:text-brand-primary" aria-label="Next slide">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}