"use client";

import { useState } from "react";
import { Leaf, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); setIsSent(true); }, 1500);
  };

  return (
    <div className="min-h-screen bg-brand-bgLight flex items-center justify-center relative overflow-hidden px-4">
      <div className="blob-1" />
      <div className="blob-2" />
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-border/30 p-8 md:p-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex flex-col items-center gap-1 mb-6">
              <div className="flex items-center gap-1.5">
                <Leaf className="text-brand-primary w-7 h-7" strokeWidth={1.5} />
                <span className="font-serif text-2xl font-semibold tracking-[0.08em] text-brand-textPrimary">GLAMO</span>
              </div>
              <span className="text-[8px] tracking-[0.35em] font-medium text-brand-textMuted uppercase -mt-0.5 ml-8">Nepal</span>
            </Link>
          </div>

          {!isSent ? (
            <>
              <div className="text-center mb-8">
                <h1 className="font-serif text-3xl font-semibold text-brand-textPrimary">Forgot Password?</h1>
                <p className="text-brand-textMuted text-sm mt-2">Enter your email and we&apos;ll send you a reset link.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="forgot-email" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-textMuted w-4 h-4" strokeWidth={1.5} />
                    <input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full pl-11 pr-4 py-3 rounded-xl border border-border bg-white text-brand-textPrimary placeholder:text-brand-textMuted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-3.5 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-bgDark transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20">
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center mx-auto mb-6">
                <Mail className="text-brand-primary w-8 h-8" strokeWidth={1.5} />
              </div>
              <h1 className="font-serif text-3xl font-semibold text-brand-textPrimary mb-2">Check Your Email</h1>
              <p className="text-brand-textMuted text-sm mb-8">We&apos;ve sent a password reset link to <span className="font-semibold text-brand-textPrimary">{email}</span></p>
              <Link href="/login" className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-bgDark transition-all duration-300 shadow-lg shadow-brand-primary/20">
                <ArrowLeft size={16} strokeWidth={1.5} /> Back to Sign In
              </Link>
            </div>
          )}

          <p className="text-center text-sm text-brand-textMuted mt-6">
            <Link href="/login" className="text-brand-primary font-medium hover:text-brand-bgDark transition-colors">Back to Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}