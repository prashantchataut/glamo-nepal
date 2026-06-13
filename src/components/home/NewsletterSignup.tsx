"use client";

import { useState } from "react";
import { ensureCsrfToken, CSRF_HEADER_NAME } from "@/lib/csrf";

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
      const csrfToken = await ensureCsrfToken();
      if (!csrfToken) {
        setError("Could not load security token. Please refresh and try again.");
        return;
      }
      const res = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json", [CSRF_HEADER_NAME]: csrfToken }, body: JSON.stringify({ email }) });
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
    <section className="bg-neutral-950 py-16 md:py-24" aria-labelledby="newsletter-heading">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
        <div>
          <h2 id="newsletter-heading" className="font-display text-4xl font-medium leading-[1.05] tracking-[-0.02em] text-white md:text-5xl">New drops, better routines.</h2>
          <p className="mt-4 max-w-md text-[0.9375rem] leading-[1.7] text-white/80">Curated product edits, restock notes and Kathmandu Valley delivery updates. No spam, no noisy beauty myths.</p>
        </div>
        <div aria-live="polite" aria-atomic="true">
          {submitted ? (
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-8" role="status">
              <p className="font-display text-2xl text-white">You&apos;re on the list.</p>
              <p className="mt-2 text-sm leading-6 text-white/80">We&apos;ll send the next GLAMO edit to your inbox.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} method="POST" action="/api/newsletter" noValidate className="flex flex-col gap-3 sm:flex-row sm:gap-3" aria-busy={submitting || undefined}>
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <input id="newsletter-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="Your email address" required aria-invalid={error ? "true" : undefined} aria-describedby={error ? "newsletter-email-error" : undefined} disabled={submitting} autoComplete="email" className="min-h-[52px] flex-1 rounded-full border border-white/15 bg-white/10 px-6 text-sm text-white placeholder:text-white/55 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <button type="submit" disabled={submitting} aria-disabled={submitting || undefined} className="min-h-[52px] rounded-full bg-primary px-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-primary-dark disabled:opacity-40">{submitting ? "Joining..." : "Join"}</button>
            </form>
          )}
          {error ? <p id="newsletter-email-error" role="alert" className="mt-3 text-sm text-red-400">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
