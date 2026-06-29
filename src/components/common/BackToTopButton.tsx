"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const show = window.scrollY > 400;
      setVisible(show);
      if (!show) setAnimating(false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => setAnimating(true));
    }
  }, [visible]);

  const handleClick = () => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  };

  if (!visible && !animating) return null;

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      onTransitionEnd={() => { if (!visible) setAnimating(false); }}
      className="fixed bottom-[calc(var(--mobile-nav-height)+16px)] right-4 z-back-to-top inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-neutral-50 shadow-lg shadow-primary/20 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 md:bottom-6 md:right-6"
      style={{
        opacity: animating && visible ? 1 : 0,
        transform: animating && visible ? "translateY(0)" : "translateY(12px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <ArrowUp size={20} />
    </button>
  );
}