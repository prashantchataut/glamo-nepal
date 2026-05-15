"use client";
import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";
import { NewsletterDark } from "@/components/ui/illustrations/NewsletterBackground";
import { csrfHeaders } from "@/lib/csrf";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (submitted && successRef.current) {
      successRef.current.focus();
    }
  }, [submitted]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setSubmitted(true);
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="relative overflow-hidden border-t border-brand-border py-12 md:py-16 lg:py-20" aria-labelledby="newsletter-heading">
      <NewsletterDark />
      <div className="relative z-10 container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center backdrop-blur-md sm:p-8 md:rounded-[2.25rem] md:p-12">
          <span className="font-label mb-6 inline-block rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold">Join the Glow Notes</span>
          <h2 id="newsletter-heading" className="font-display text-3xl font-semibold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">Get Glowing. <span className="italic text-brand-primary-light">Get GLAMO.</span></h2>
          <p className="mx-auto mt-5 mb-8 max-w-lg text-base leading-7 text-white/70">New arrivals, routine tips and Nepal-only beauty edits without inbox clutter.</p>
          <div aria-live="polite">
            {submitted ? (
              <div ref={successRef} tabIndex={-1} className="mx-auto max-w-md rounded-full border border-brand-primary/30 bg-brand-primary/20 px-8 py-4 text-center outline-none">
                <p className="font-bold text-brand-gold">You are on the list!</p>
                <p className="mt-1 text-sm text-white/60">We will reach out when our newsletter launches. Thank you for your interest.</p>
              </div>
            ) : (
              <form className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row" onSubmit={handleSubmit} noValidate>
                <div className="relative flex-grow">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" strokeWidth={1.5} aria-hidden="true" />
                  <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                  <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="Enter your email address"
                    required
                    aria-invalid={error ? "true" : undefined}
                    aria-describedby={error ? "newsletter-email-error" : undefined}
                    disabled={submitting}
                    className="w-full rounded-full border border-white/15 bg-white/10 py-4 pl-12 pr-6 text-white placeholder:text-white/40 outline-none transition-all duration-300 focus:border-brand-gold/40 focus:ring-2 focus:ring-brand-gold/20 disabled:opacity-60"
                  />
                </div>
                <button type="submit" disabled={submitting} className="btn-press whitespace-nowrap rounded-full bg-brand-gold px-8 py-4 font-bold text-brand-bgDark shadow-lg shadow-brand-gold/20 transition hover:bg-brand-gold/90 cursor-pointer disabled:opacity-60">{submitting ? "Submitting..." : "Join waitlist"}</button>
              </form>
            )}
            {error && <p id="newsletter-email-error" role="alert" className="mt-2 text-sm text-red-300">{error}</p>}
          </div>
          <p className="mt-5 text-xs text-white/40">No spam. Just glow tips and exclusive deals.</p>
        </div>
      </div>
    </section>
  );
}