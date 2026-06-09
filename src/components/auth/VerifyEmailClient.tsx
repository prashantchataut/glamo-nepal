"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { GlamoApiError } from "@/lib/api/client";
import { toast } from "sonner";
import Link from "next/link";
import { inputClasses, primaryButtonClasses, errorBoxClasses, successBoxClasses } from "@/lib/form-styles";

export function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState("");
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const token = searchParams.get("token");

  async function handleVerify() {
    if (!token) {
      setError("Invalid verification link. Please request a new one.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      await authApi.verifyEmail(token);
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof GlamoApiError) {
        if (err.code === "INVALID_TOKEN") {
          setError("This verification link has expired. Please request a new one.");
        } else {
          setError(err.message || "Verification failed. Please try again.");
        }
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    setResendLoading(true);
    setError("");
    try {
      await authApi.sendVerificationEmail(email);
      setResendSuccess(true);
    } catch {
      setResendSuccess(true);
    } finally {
      setResendLoading(false);
    }
  }

  if (token && !success && !error) {
    return (
      <main className="bg-[#fbf7f3] py-10 md:py-16">
        <div className="container mx-auto max-w-md px-4 md:px-6 text-center">
          <h1 className="font-display text-3xl font-semibold text-neutral-900">Verifying your email</h1>
          <p className="mt-4 text-neutral-500">Click the button below to complete verification.</p>
          <button
            onClick={handleVerify}
            disabled={isLoading}
            className={primaryButtonClasses + " mt-6 max-w-xs"}
          >
            {isLoading ? "Verifying..." : "Verify Email"}
          </button>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="bg-[#fbf7f3] py-10 md:py-16">
        <div className="container mx-auto max-w-md px-4 md:px-6">
          <h1 className="font-display text-3xl font-semibold text-neutral-900">Email verified!</h1>
          <p className="mt-4 text-neutral-500">
            Your email has been verified successfully. You can now <Link href="/login" className="font-semibold text-primary hover:text-neutral-900 transition-colors">sign in</Link> to your account.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#fbf7f3] py-10 md:py-16">
      <div className="container mx-auto max-w-md px-4 md:px-6">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Verify your email</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Enter your email address and we&apos;ll send you a new verification link.
        </p>

        {error && (
          <div className="mt-6 rounded-[1.25rem] border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
            {error}
          </div>
        )}

        {resendSuccess ? (
          <div className={successBoxClasses + " mt-6"}>
            If an account with that email exists, a verification link has been sent.
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleResend(); }} className="mt-8 space-y-5">
            <div className="w-full">
              <label htmlFor="verify-email" className="type-label mb-2 block text-neutral-400">
                Email address
              </label>
              <input
                id="verify-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                required
              />
            </div>

            <button
              type="submit"
              disabled={resendLoading || !email}
              className={primaryButtonClasses}
            >
              {resendLoading ? "Sending..." : "Send verification link"}
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