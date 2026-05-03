"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { useState } from "react";
import { Mail } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); if (!email) return; localStorage.setItem("glamo-newsletter-interest", email); setSubmitted(true); }

  return (
    <section className="relative overflow-hidden border-t border-brand-border bg-brand-surfaceWarm py-16 md:py-20 lg:py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-secondary/30 blur-[110px]" />
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-[2.25rem] border border-brand-border bg-white/82 p-8 text-center shadow-[0_30px_90px_-65px_rgba(36,31,34,0.45)] backdrop-blur md:p-12">
          <span className="mb-6 inline-block rounded-full bg-brand-primary-light px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary">Join the Glow Notes</span>
          <h2 className="font-serif text-4xl font-semibold leading-tight text-brand-textPrimary md:text-5xl lg:text-6xl">Get Glowing. <span className="italic text-brand-primary">Get GLAMO.</span></h2>
          <p className="mx-auto mt-5 mb-8 max-w-lg text-base leading-7 text-brand-textMuted">New arrivals, routine tips and Nepal-only beauty edits without inbox clutter.</p>
          {submitted ? (
            <div className="mx-auto max-w-md rounded-full border border-brand-primary/20 bg-brand-primary-light px-8 py-4 text-center"><p className="font-bold text-brand-primary">You are on the list!</p><p className="mt-1 text-sm text-brand-primary/70">We will reach out when our newsletter launches. Thank you for your interest.</p></div>
          ) : (
            <form className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
              <div className="relative flex-grow"><Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-textMuted" strokeWidth={1.5} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" required className="w-full rounded-full border border-brand-border bg-brand-bgLight py-4 pl-12 pr-6 text-brand-textPrimary placeholder:text-brand-textMuted/60 outline-none transition-all duration-300 focus:border-brand-primary/40 focus:ring-2 focus:ring-brand-primary/20" /></div>
              <button type="submit" className="btn-press whitespace-nowrap rounded-full bg-brand-primary px-8 py-4 font-bold text-white shadow-lg shadow-brand-primary/15 transition hover:bg-brand-primary-hover">Join waitlist</button>
            </form>
          )}
          <p className="mt-5 text-xs text-brand-textMuted">No spam. Just glow tips and exclusive deals.</p>
        </div>
      </div>
    </section>
  );
}
