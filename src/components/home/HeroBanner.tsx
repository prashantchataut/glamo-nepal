"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO_SLIDES } from "@/lib/constants";
import { HeroBackground } from "@/components/ui/illustrations/HeroBackground";
import { HeroCalloutCardA, HeroCalloutCardB, HeroCalloutCardC } from "@/components/ui/illustrations/HeroCalloutCards";

export function HeroBanner() {
  const reduceMotion = useReducedMotion();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: reduceMotion ? 99999999 : 6500, stopOnInteraction: false })]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

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

  const toggleAutoplay = useCallback(() => {
    if (!emblaApi) return;
    const autoplay = emblaApi.plugins()?.autoplay;
    if (!autoplay) return;
    if (isPlaying) {
      autoplay.stop();
    } else {
      autoplay.play();
    }
    setIsPlaying(!isPlaying);
  }, [emblaApi, isPlaying]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") scrollPrev();
    if (e.key === "ArrowRight") scrollNext();
  }, [scrollPrev, scrollNext]);

  return (
    <section className="border-b border-border/60 bg-brand-surfacePink" aria-roledescription="carousel" aria-label="Featured products and promotions">
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_28px_80px_-50px_rgba(56,26,44,0.35)] ring-1 ring-black/5 relative">
          <div className="absolute inset-0 pointer-events-none z-0 hidden md:block">
            <HeroBackground />
          </div>
          <div ref={emblaRef} className="overflow-hidden" onKeyDown={handleKeyDown} tabIndex={0} role="group" aria-roledescription="slide container" aria-label="Hero carousel slides">
            <div className="flex" aria-live={reduceMotion ? "polite" : "off"}>
              {HERO_SLIDES.map((slide, index) => (
                <div key={slide.id} className="min-w-0 flex-[0_0_100%]" role="group" aria-roledescription="slide" aria-label={`${slide.title1} ${slide.title2} - ${slide.annotation}`} aria-current={index === selectedIndex ? "true" : undefined}>
                  <div className={cn("grid min-h-[340px] items-center gap-6 px-5 py-8 sm:min-h-[440px] sm:gap-8 sm:px-8 sm:py-10 md:grid-cols-[1.05fr_0.95fr] md:min-h-[520px] md:px-12 md:py-12 lg:min-h-[600px] lg:px-16", slide.bgColor)}>
                    <div className="relative z-10 order-2 md:order-1 max-w-xl">
                      <span className="font-label inline-flex rounded-full bg-white/80 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary ring-1 ring-brand-primary/10 backdrop-blur">
                        {slide.annotation}
                      </span>
                      <h1 className="mt-3 font-display text-[clamp(2rem,6vw,5.5rem)] font-semibold leading-[0.92] text-brand-textPrimary">
                        <span className="block">{slide.title1}</span>
                        <span className="mt-2 block italic text-brand-primary">{slide.title2}</span>
                      </h1>
                      <p className="mt-6 max-w-lg text-base leading-7 text-brand-textMuted md:text-lg">{slide.subtitle}</p>
                      <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
                        <Link href={slide.ctaLink} className="inline-flex items-center justify-center rounded-full bg-brand-primary px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-brand-bgDark cursor-pointer">
                          {slide.cta}
                        </Link>
                        <Link href="/shop" className="inline-flex items-center justify-center rounded-full border border-brand-textPrimary/15 bg-white/70 px-7 py-3.5 text-sm font-semibold text-brand-textPrimary transition hover:border-brand-primary hover:text-brand-primary cursor-pointer">
                          Browse all products
                        </Link>
                      </div>
                      <div className="mt-6 grid max-w-lg grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 text-left">
                        {[
                          ["रू pricing", "Easy local shopping"],
                          ["Authentic picks", "Curated beauty edits"],
                          ["Delivery across Nepal", "Valley-friendly service"],
                        ].map(([title, body]) => (
                          <div key={title} className="rounded-2xl bg-white/70 px-4 py-4 ring-1 ring-black/5 backdrop-blur">
                            <p className="font-label text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary">{title}</p>
                            <p className="mt-2 text-xs leading-5 text-brand-textMuted">{body}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="relative z-10 order-1 md:order-2 hidden md:flex items-center justify-center">
                      <div className="pointer-events-none absolute inset-x-10 top-8 h-20 rounded-full bg-white/50 blur-2xl" />
                      <HeroCalloutCardA className="absolute -right-2 top-12 z-20 hidden lg:block" />
                      <HeroCalloutCardB className="absolute -left-4 bottom-16 z-20 hidden lg:block" />
                      <HeroCalloutCardC className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 hidden lg:block" />
                      <div className="relative aspect-[4/4.8] w-full max-w-[460px] overflow-hidden rounded-[2rem] bg-white/60 p-3 ring-1 ring-black/5">
                        <div className="absolute bottom-6 left-6 z-10 max-w-[220px] rounded-[1.5rem] bg-white/92 px-5 py-4 shadow-lg ring-1 ring-black/5 backdrop-blur">
                          <p className="font-label text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">GLAMO edit</p>
                          <p className="mt-2 font-display text-2xl font-semibold text-brand-textPrimary">{slide.title1} {slide.title2}</p>
                          <p className="mt-1 text-sm leading-6 text-brand-textMuted">{slide.subtitle}</p>
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
            <div className="flex items-center gap-2" role="tablist" aria-label="Carousel slide indicators">
              {HERO_SLIDES.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => emblaApi?.scrollTo(index)}
                  role="tab"
                  aria-selected={index === selectedIndex}
                  aria-label={`Go to slide: ${slide.title1} ${slide.title2}`}
                  className={cn(
                    "h-2 rounded-full p-2 transition-all duration-300",
                    index === selectedIndex
                      ? "w-10 bg-brand-primary"
                      : "w-2 bg-brand-primary/25 hover:bg-brand-primary/45"
                  )}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={toggleAutoplay} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-textPrimary/10 text-brand-textPrimary transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2" aria-label={isPlaying ? "Pause carousel" : "Play carousel"}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button onClick={scrollPrev} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-textPrimary/10 text-brand-textPrimary transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2" aria-label="Previous slide">
                <ChevronLeft size={18} />
              </button>
              <button onClick={scrollNext} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-brand-textPrimary/10 text-brand-textPrimary transition hover:border-brand-primary hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary focus-visible:outline-offset-2" aria-label="Next slide">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}