"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Leaf, Phone, ShieldCheck, Truck, X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";
import { ANNOUNCEMENT_MESSAGES } from "@/lib/constants";

const iconMap = { truck: Truck, leaf: Leaf, shield: ShieldCheck, phone: Phone };
const WHATSAPP_URL = SITE_CONFIG.whatsapp;

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("announcement-dismissed")) setIsVisible(false);
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const startAutoPlay = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENT_MESSAGES.length);
      startAutoPlay();
    }, prefersReducedMotion ? 10000 : 4000);
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (isPlaying && isVisible) {
      startAutoPlay();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, isVisible, startAutoPlay]);

  function handleDismiss() {
    setIsVisible(false);
    sessionStorage.setItem("announcement-dismissed", "true");
  }

  if (!isVisible) return null;

  const currentMsg = ANNOUNCEMENT_MESSAGES[currentIndex];
  const Icon = currentMsg ? iconMap[currentMsg.icon as keyof typeof iconMap] : null;

  return (
    <div
      className="font-label relative z-announcement border-b border-brand-border/70 bg-brand-surfaceWarm/95 text-xs font-bold uppercase tracking-[0.16em] text-brand-textPrimary backdrop-blur-xl md:text-xs"
      aria-label="Announcements"
      aria-live="polite"
      aria-atomic="true"
      role="region"
    >
      <div className="flex items-center justify-center gap-3 py-3 px-10">
        {currentMsg && (
          <>
            {Icon ? <Icon size={14} className="text-brand-primary shrink-0" strokeWidth={1.8} aria-hidden="true" /> : null}
            {currentMsg.icon === "phone" ? (
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline decoration-brand-primary/30 underline-offset-2 transition hover:decoration-brand-primary hover:text-brand-primary">
                <span>{currentMsg.text}</span>
              </a>
            ) : (
              <span>{currentMsg.text}</span>
            )}
          </>
        )}
      </div>
      <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1">
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-textMuted shadow-sm transition hover:text-brand-primary"
          aria-label={isPlaying ? "Pause announcements" : "Play announcements"}
          aria-pressed={isPlaying}
        >
          {isPlaying ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><rect x="2" y="1" width="3" height="10" rx="0.5" /><rect x="7" y="1" width="3" height="10" rx="0.5" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><polygon points="2,1 11,6 2,11" /></svg>
          )}
        </button>
        <button
          onClick={handleDismiss}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-brand-textMuted shadow-sm transition hover:text-brand-primary"
          aria-label="Close announcement"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}