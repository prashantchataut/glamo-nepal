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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 6000, stopOnInteraction: false }),
  ]);
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
    <section className="relative w-full overflow-hidden bg-grain">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="blob-1" />
        <div className="blob-2" />
      </div>

      <div className="relative z-10" ref={emblaRef}>
        <div className="flex h-[75vh] min-h-[620px] max-h-[850px] md:h-[85vh]">
          {HERO_SLIDES.map((slide, index) => (
            <div key={slide.id} className="relative flex-[0_0_100%] min-w-0">
              <div className={cn("absolute inset-0 opacity-40 transition-opacity duration-700", slide.bgColor)} />

              <div className="container mx-auto px-4 md:px-8 h-full flex flex-col md:flex-row items-center">
                <div className="w-full md:w-1/2 pt-24 md:pt-0 pr-0 md:pr-16 flex flex-col items-center md:items-start text-center md:text-left z-20 relative">
                  <span className="inline-block px-4 py-1.5 bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-6 border border-brand-primary/20">
                    {slide.annotation}
                  </span>
                  <h1 className="font-serif text-5xl md:text-6xl lg:text-[5.5rem] font-semibold leading-[1.05] mb-6">
                    <span className={cn("block text-brand-textPrimary", index === selectedIndex && "animate-in slide-in-from-bottom-8 fade-in duration-700")}>
                      {slide.title1}
                    </span>
                    <span className={cn("block text-brand-primary italic", index === selectedIndex && "animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150")}>
                      {slide.title2}
                    </span>
                  </h1>
                  <p className={cn("text-brand-textMuted text-base md:text-lg mb-8 max-w-md leading-relaxed", index === selectedIndex && "animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300")}>
                    {slide.subtitle}
                  </p>
                  <div className={cn("flex items-center gap-4", index === selectedIndex && "animate-in slide-in-from-bottom-8 fade-in duration-700 delay-500")}>
                    <Link href={slide.ctaLink} className="inline-flex items-center justify-center px-8 py-4 bg-brand-primary text-white rounded-full font-medium tracking-wide hover:bg-brand-bgDark transition-all duration-300 shadow-lg shadow-brand-primary/25 hover:shadow-xl hover:shadow-brand-bgDark/20 hover:scale-[1.02] active:scale-[0.98]">
                      {slide.cta}
                    </Link>
                    <Link href="/shop" className="inline-flex items-center justify-center px-8 py-4 border-2 border-brand-textPrimary/20 text-brand-textPrimary rounded-full font-medium hover:border-brand-primary hover:text-brand-primary transition-all duration-300">
                      View All
                    </Link>
                  </div>
                </div>

                <div className="w-full md:w-1/2 h-1/2 md:h-full relative mt-8 md:mt-0 z-10 flex items-center justify-center">
                  <div className="relative w-[75%] md:w-[65%] max-w-[420px] aspect-[4/5]">
                    <div className="absolute -inset-4 bg-brand-secondary/20 rounded-[60px] blur-2xl" />
                    <div className="relative w-full h-full rounded-[40px] overflow-hidden border-4 border-white/60 shadow-2xl shadow-brand-primary/10">
                      <Image
                        src={slide.image}
                        alt={`${slide.title1} ${slide.title2}`}
                        fill
                        className={cn("object-cover transition-transform duration-1000", index === selectedIndex ? "scale-100" : "scale-105")}
                        priority={index === 0}
                        sizes="(max-width: 768px) 75vw, 35vw"
                      />
                    </div>
                    <div className="absolute top-[20%] -right-2 md:-right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/40 z-20 animate-[float_6s_ease-in-out_infinite]">
                      <span className="text-xs font-bold tracking-wider uppercase text-brand-primary flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                        {slide.annotation}
                      </span>
                    </div>
                  </div>

                  <div className="absolute bottom-8 md:bottom-16 left-4 md:left-0 w-16 h-16 md:w-20 md:h-20 border border-brand-primary/20 rounded-full" />
                  <div className="absolute top-8 md:top-12 right-8 md:right-12 w-8 h-8 md:w-10 md:h-10 bg-brand-gold/20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 z-30 container mx-auto px-4 md:px-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "h-1 transition-all duration-500 rounded-full",
                index === selectedIndex
                  ? "w-10 bg-brand-primary"
                  : "w-3 bg-brand-primary/30 hover:bg-brand-primary/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={scrollPrev}
            className="w-11 h-11 rounded-full border border-brand-primary/20 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} strokeWidth={1.5} />
          </button>
          <button
            onClick={scrollNext}
            className="w-11 h-11 rounded-full border border-brand-primary/20 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300 hover:scale-110 active:scale-95"
            aria-label="Next slide"
          >
            <ChevronRight size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
}