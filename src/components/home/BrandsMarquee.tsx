"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { BRAND_LOGOS } from "@/lib/constants";

export function BrandsMarquee() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const startAutoPlay = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % BRAND_LOGOS.length);
      startAutoPlay();
    }, prefersReducedMotion ? 6000 : 3000);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (isPlaying) {
      startAutoPlay();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, startAutoPlay]);

  const currentBrand = BRAND_LOGOS[currentIndex];

  return (
    <section
      className="py-14 md:py-20 bg-white border-y border-border/30 overflow-hidden"
      aria-label="Trusted brands"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mb-10 text-center">
        <p className="font-label text-brand-textMuted text-xs md:text-sm uppercase tracking-[0.25em] font-bold">
          Trusted by the finest brands
        </p>
      </div>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-6">
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-brand-border bg-white text-brand-textMuted transition hover:text-brand-primary hover:border-brand-primary"
          aria-label={isPlaying ? "Pause brand rotation" : "Play brand rotation"}
          aria-pressed={isPlaying}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><rect x="2" y="1" width="3" height="10" rx="0.5" /><rect x="7" y="1" width="3" height="10" rx="0.5" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><polygon points="2,1 11,6 2,11" /></svg>
          )}
        </button>
        {currentBrand && (
          <div className="flex items-center justify-center opacity-60 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-500">
            <Image
              src={currentBrand.image}
              alt={currentBrand.name}
              width={120}
              height={40}
              className="h-8 md:h-10 w-auto object-contain"
            />
          </div>
        )}
      </div>
    </section>
  );
}