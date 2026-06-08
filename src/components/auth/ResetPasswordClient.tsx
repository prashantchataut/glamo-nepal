"use client";

import { useState } from "react";
import { confirmPasswordReset, isFirebaseConfigured } from "@/lib/firebase";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const oobCode = searchParams.get("oobCode");
    if (!oobCode) {
      setError("Invalid or expired password reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);
    try {
      if (!isFirebaseConfigured) {
        setError("Authentication is not available. Please try again later.");
        setIsLoading(false);
        return;
      }
      await confirmPasswordReset(oobCode, newPassword);
      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password. The link may have expired.";
      if (message.includes("expired") || message.includes("invalid")) {
        setError("This password reset link has expired. Please request a new one.");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="bg-[#fbf7f3] py-10 md:py-16">
      <div className="container mx-auto max-w-md px-4 md:px-6">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Set new password</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Enter your new password below.
        </p>

        {success ? (
          <div className="mt-8 rounded-[1.25rem] border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
            Your password has been reset. You can now <Link href="/login" className="font-semibold underline">sign in</Link> with your new password.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="w-full">
              <label htmlFor="new-password" className="type-label mb-2 block text-neutral-400">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-[1.15rem] border border-neutral-200 bg-white px-4 py-3 font-sans text-body-md text-neutral-900 transition-colors duration-200 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                required
                minLength={8}
              />
            </div>

            <div className="w-full">
              <label htmlFor="confirm-password" className="type-label mb-2 block text-neutral-400">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-[1.15rem] border border-neutral-200 bg-white px-4 py-3 font-sans text-body-md text-neutral-900 transition-colors duration-200 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className="rounded-[1.25rem] border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="btn-press w-full min-h-[44px] bg-primary px-6 py-3 text-[13px] font-medium uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Resetting..." : "Reset password"}
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