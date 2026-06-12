"use client";

import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import { GlamoApiError } from "@/lib/api/client";
import { toast } from "sonner";
import Link from "next/link";
import { inputClasses, primaryButtonClasses, errorBoxClasses, successBoxClasses } from "@/lib/form-styles";

export function ForgotPasswordClient() {
const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown) return;
    setError("");
    setIsLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 60000);
      toast.success("If an account with that email exists, a reset link has been sent.");
    } catch (err: unknown) {
      if (err instanceof GlamoApiError) {
        if (err.status === 429) {
          setError("Too many attempts. Please wait a few minutes and try again.");
          setCooldown(true);
          setTimeout(() => setCooldown(false), 60000);
        } else {
          setError(err.message || "Failed to send reset email. Please try again.");
        }
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="bg-neutral-100 py-10 md:py-16">
      <div className="container mx-auto max-w-md px-4 md:px-6">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Reset your password</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        {sent ? (
          <div className={successBoxClasses}>
            Check your email for a password reset link. You can now return to the <Link href="/login" className="font-semibold underline">sign in page</Link>.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="w-full">
              <label htmlFor="forgot-email" className="type-label mb-2 block text-neutral-500">
                Email address
              </label>
              <input
                id="forgot-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                required
              />
            </div>

            {error && (
              <div className={errorBoxClasses} role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || cooldown || !email}
              className={primaryButtonClasses}
            >
              {isLoading ? "Sending..." : cooldown ? "Please wait..." : "Send reset link"}
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