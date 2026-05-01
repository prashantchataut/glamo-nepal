"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: Wire to real newsletter API (e.g., Mailchimp, ConvertKit)
    setSubmitted(true);
  }

  return (
    <section className="py-24 md:py-32 bg-brand-bgDark text-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-square bg-brand-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-brand-secondary/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-2xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full mb-8 border border-white/10">
            Join the Inner Circle
          </span>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium mb-6 leading-tight">
            Get Glowing. <span className="text-brand-secondary italic">Get Glamo.</span>
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            Join our inner circle. Be the first to know about new arrivals, exclusive sales, and our expert beauty secrets.
          </p>

          {submitted ? (
            <div className="max-w-md mx-auto">
              <div className="rounded-full bg-emerald-500/20 border border-emerald-400/30 py-4 px-8 text-center">
                <p className="text-emerald-300 font-semibold">You are in!</p>
                <p className="text-white/60 text-sm mt-1">We will send beauty updates to your inbox.</p>
              </div>
            </div>
          ) : (
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleSubmit}>
              <div className="relative flex-grow">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  className="w-full bg-white/10 border border-white/15 rounded-full py-4 pl-12 pr-6 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300"
                />
              </div>
              <button
                type="submit"
                className="bg-brand-primary hover:bg-brand-secondary text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 whitespace-nowrap shadow-lg shadow-brand-primary/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                Subscribe
              </button>
            </form>
          )}
          <p className="text-white/30 text-xs mt-5">
            No spam. Just glow tips and exclusive deals. You can unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}