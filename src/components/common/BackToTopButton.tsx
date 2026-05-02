"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className={cn("fixed bottom-20 left-4 z-back-to-top rounded-full border border-brand-secondary/30 bg-white p-3 text-brand-primary shadow-lg transition-all md:bottom-6 md:left-6", visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")} aria-label="Back to top">
      <ArrowUp size={20} />
    </button>
  );
}