"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function LazySection({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: "200px" },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }
    setIsVisible(true);
  }, []);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : <div className="min-h-[200px]" />}
    </div>
  );
}