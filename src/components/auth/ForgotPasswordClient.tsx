"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import Link from "next/link";

export function ForgotPasswordClient() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await signIn("password", { email, flow: "reset" });
      setSent(true);
      toast.success("If an account with that email exists, a reset link has been sent.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send reset email. Please try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="bg-[#fbf7f3] py-10 md:py-16">
      <div className="container mx-auto max-w-md px-4 md:px-6">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Reset your password</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        {sent ? (
          <div className="mt-8 rounded-[1.25rem] border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            Check your email for a password reset link. You can now return to the <Link href="/login" className="font-semibold underline">sign in page</Link>.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="w-full">
              <label htmlFor="forgot-email" className="type-label mb-2 block text-neutral-400">
                Email address
              </label>
              <input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[1.15rem] border border-neutral-200 bg-white px-4 py-3 font-sans text-body-md text-neutral-900 transition-colors duration-200 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                required
              />
            </div>

            {error && (
              <div className="rounded-[1.25rem] border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !email}
              className="btn-press w-full min-h-[44px] bg-primary px-6 py-3 text-[13px] font-medium uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-neutral-500">
          <Link href="/login" className="font-semibold text-primary hover:text-neutral-900 transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}