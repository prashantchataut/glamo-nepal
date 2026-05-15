"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Link from "next/link";
import { MoveRight } from "lucide-react";
import { PhilosophyBackground } from "@/components/ui/illustrations/PhilosophyBackground";

export function BrandPhilosophyBanner() {
  return (
    <section className="relative py-12 md:py-16 lg:py-20 overflow-hidden">
      <PhilosophyBackground />
      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="font-label inline-block px-4 py-1.5 bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-6 md:mb-8 border border-brand-primary/15">
            Our Philosophy
          </span>
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] font-medium leading-[1.1] mb-8 text-brand-textPrimary tracking-tight">
            Beauty That Loves <span className="text-brand-primary italic">Your</span> Skin Back
          </h2>
          <p className="text-brand-textMuted text-base md:text-lg mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
            At Glamo Nepal, we believe in mindful beauty. Every product is ethically sourced, dermatologically tested, and crafted to enhance your natural radiance without compromising skin health.
          </p>
          <Link
            href="/about"
            className="font-label inline-flex items-center gap-3 px-10 py-4 border-2 border-brand-primary text-brand-primary rounded-full font-semibold uppercase tracking-[0.15em] text-sm hover:bg-brand-primary hover:text-white transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            Our Story <MoveRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}