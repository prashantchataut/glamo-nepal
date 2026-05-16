"use client";

import { useState } from "react";
import Image from "next/image";
import { csrfHeaders } from "@/lib/csrf";
import { IMAGES } from "@/lib/image-library";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json", ...csrfHeaders() }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (data.success || data.status === "success") setSubmitted(true);
      else setError(data.message || "Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bg-cream-100 py-16 md:py-24" aria-labelledby="newsletter-heading">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="relative hidden aspect-[4/3] overflow-hidden bg-cream-100 md:block">
          <Image src={IMAGES.hero.secondary} alt="Luxury skincare flatlay" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" />
        </div>
        <div className="bg-cream-50 p-7 shadow-card md:p-10 lg:p-12">
          <p className="type-label text-brand-rose">GLAMO letters</p>
          <h2 id="newsletter-heading" className="mt-3 font-display text-5xl font-light leading-tight text-ink md:text-6xl">New drops, better routines.</h2>
          <p className="mt-4 max-w-lg text-base leading-8 text-cream-700">Receive curated product edits, restock notes and Nepal delivery updates. No spam, no noisy beauty myths.</p>
          <div aria-live="polite" className="mt-8">
            {submitted ? (
              <div className="border border-cream-200 bg-cream-100 p-5">
                <p className="font-display text-2xl text-ink">You’re on the list.</p>
                <p className="mt-2 text-sm leading-6 text-cream-400">We’ll send the next GLAMO edit to your inbox.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                <input id="newsletter-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="Email address" required aria-invalid={error ? "true" : undefined} aria-describedby={error ? "newsletter-email-error" : undefined} disabled={submitting} className="min-h-12 border border-cream-300 bg-cream-50 px-4 text-sm text-ink placeholder:text-cream-400 focus:border-brand-rose focus:outline-none" />
                <button type="submit" disabled={submitting} className="min-h-12 bg-ink px-7 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-brand-rose disabled:opacity-50">{submitting ? "Joining..." : "Join"}</button>
              </form>
            )}
            {error ? <p id="newsletter-email-error" role="alert" className="mt-3 text-sm text-error">{error}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
