"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Link from "next/link";
import { MoveRight } from "lucide-react";

export function BrandPhilosophyBanner() {
  return (
    <section className="relative py-16 md:py-20 lg:py-24 overflow-hidden bg-gradient-to-br from-brand-bgLight via-brand-secondary/10 to-brand-bgLight">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-15">
        <svg className="absolute -left-20 top-10 w-64 h-64 text-brand-primary" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 0 C50 50, 0 50, 0 50 C0 50, 50 50, 50 100 C50 50, 100 50, 100 50 C100 50, 50 50, 50 0 Z" />
        </svg>
        <svg className="absolute -right-20 bottom-10 w-80 h-80 text-brand-secondary" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50 0 C50 50, 0 50, 0 50 C0 50, 50 50, 50 100 C50 50, 100 50, 100 50 C100 50, 50 50, 50 0 Z" />
        </svg>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-8 border border-brand-primary/15">
            Our Philosophy
          </span>
          <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] font-medium leading-[1.1] mb-8 text-brand-textPrimary">
            Beauty That Loves <span className="text-brand-primary italic">Your</span> Skin Back
          </h2>
          <p className="text-brand-textMuted text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            At Glamo Nepal, we believe in mindful beauty. Every product is ethically sourced, dermatologically tested, and crafted to enhance your natural radiance without compromising skin health.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-3 px-10 py-4 border-2 border-brand-primary text-brand-primary rounded-full font-semibold uppercase tracking-[0.15em] text-sm hover:bg-brand-primary hover:text-white transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            Our Story <MoveRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}