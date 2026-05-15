"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TrustIcon, TrustIconName } from "@/components/ui/illustrations/TrustIcons";
import { TRUST_BADGES } from "@/lib/constants";

const iconMap: Record<string, TrustIconName> = {
  heart: "cruelty-free",
  shield: "authentic",
  sparkles: "dermatologist",
  leaf: "vegan",
  award: "safe-skin",
};

export function TrustBadgeMarquee() {
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
      setCurrentIndex((prev) => (prev + 1) % TRUST_BADGES.length);
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

  const currentBadge = TRUST_BADGES[currentIndex];
  const iconName = currentBadge ? iconMap[currentBadge.icon] || "cruelty-free" : "cruelty-free";

  return (
    <div
      className="bg-brand-primary text-white py-3.5 border-y border-brand-primary/20"
      role="region"
      aria-label="Trust badges"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-4">
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label={isPlaying ? "Pause trust badge rotation" : "Play trust badge rotation"}
          aria-pressed={isPlaying}
        >
          {isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><rect x="2" y="1" width="3" height="10" rx="0.5" /><rect x="7" y="1" width="3" height="10" rx="0.5" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><polygon points="2,1 11,6 2,11" /></svg>
          )}
        </button>
        {currentBadge && (
          <div className="flex items-center gap-3">
            <span className="p-2 bg-white/10 rounded-full">
              <TrustIcon name={iconName} size={18} />
            </span>
            <span className="font-label font-medium tracking-[0.08em] text-xs md:text-sm uppercase">{currentBadge.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}