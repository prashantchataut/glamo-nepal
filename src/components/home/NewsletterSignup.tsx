"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { csrfHeaders } from "@/lib/csrf";

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
    <section className="bg-neutral-100 py-16 md:py-24" aria-labelledby="newsletter-heading">
      <div className="mx-auto max-w-lg px-4 text-center md:px-6">
        <h2
          id="newsletter-heading"
          className="type-display-md text-neutral-900"
        >
          Join the GLAMO Community
        </h2>
        <p className="type-body-md mt-4 text-neutral-400">
          Be the first to know about new arrivals, exclusive offers, and beauty
          tips.
        </p>

        <div aria-live="polite" className="mt-8">
          {submitted ? (
            <div className="border border-neutral-200 bg-surface p-6">
              <p className="font-display text-lg font-medium text-neutral-900">
                You&apos;re on the list!
              </p>
              <p className="type-body-sm mt-2 text-neutral-400">
                We&apos;ll reach out when we have something special for you.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-3 sm:flex-row"
            >
              <div className="relative flex-grow">
                <Mail
                  className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-neutral-400"
                  size={18}
                  aria-hidden="true"
                />
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Your email address"
                  required
                  aria-invalid={error ? "true" : undefined}
                  aria-describedby={
                    error ? "newsletter-email-error" : undefined
                  }
                  disabled={submitting}
                  className="w-full border-b border-neutral-300 bg-transparent py-3 pl-7 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-primary px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {submitting ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
          )}
          {error && (
            <p
              id="newsletter-email-error"
              role="alert"
              className="mt-3 text-sm text-error"
            >
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}