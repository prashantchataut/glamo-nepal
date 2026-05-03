"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { useState } from "react";
import { Mail } from "lucide-react";
import { NewsletterDark } from "@/components/ui/illustrations/NewsletterBackground";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); if (!email) return; localStorage.setItem("glamo-newsletter-interest", email); setSubmitted(true); }

  return (
    <section className="relative overflow-hidden border-t border-brand-border py-16 md:py-20 lg:py-24">
      <NewsletterDark />
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2.25rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md md:p-12">
          <span className="mb-6 inline-block rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#C9A84C]">Join the Glow Notes</span>
          <h2 className="font-serif text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl">Get Glowing. <span className="italic text-[#D4A0D7]">Get GLAMO.</span></h2>
          <p className="mx-auto mt-5 mb-8 max-w-lg text-base leading-7 text-white/70">New arrivals, routine tips and Nepal-only beauty edits without inbox clutter.</p>
          {submitted ? (
            <div className="mx-auto max-w-md rounded-full border border-[#8B3A8F]/30 bg-[#8B3A8F]/20 px-8 py-4 text-center"><p className="font-bold text-[#C9A84C]">You are on the list!</p><p className="mt-1 text-sm text-white/60">We will reach out when our newsletter launches. Thank you for your interest.</p></div>
          ) : (
            <form className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
              <div className="relative flex-grow"><Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" strokeWidth={1.5} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" required className="w-full rounded-full border border-white/15 bg-white/10 py-4 pl-12 pr-6 text-white placeholder:text-white/40 outline-none transition-all duration-300 focus:border-[#C9A84C]/40 focus:ring-2 focus:ring-[#C9A84C]/20" /></div>
              <button type="submit" className="btn-press whitespace-nowrap rounded-full bg-[#C9A84C] px-8 py-4 font-bold text-[#1A0A1E] shadow-lg shadow-[#C9A84C]/20 transition hover:bg-[#b8973f]">Join waitlist</button>
            </form>
          )}
          <p className="mt-5 text-xs text-white/40">No spam. Just glow tips and exclusive deals.</p>
        </div>
      </div>
    </section>
  );
}
