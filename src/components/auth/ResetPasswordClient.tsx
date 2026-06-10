"use client";

import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import { GlamoApiError } from "@/lib/api/client";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { inputClasses, primaryButtonClasses, errorBoxClasses, successBoxClasses } from "@/lib/form-styles";

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

    const token = searchParams.get("token");
    if (!token) {
      setError("Invalid or expired password reset link. Please request a new one.");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
      toast.success("Password reset successfully!");
    } catch (err: unknown) {
      if (err instanceof GlamoApiError) {
        if (err.status === 429) {
          setError("Too many attempts. Please wait a few minutes and try again.");
        } else if (err.code === "INVALID_TOKEN") {
          setError("This password reset link has expired. Please request a new one.");
        } else {
          setError(err.message || "Failed to reset password. Please try again.");
        }
      } else {
        setError("Failed to reset password. The link may have expired.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="bg-neutral-100 py-10 md:py-16">
      <div className="container mx-auto max-w-md px-4 md:px-6">
        <h1 className="font-display text-3xl font-semibold text-neutral-900">Set new password</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Enter your new password below.
        </p>

        {success ? (
          <div className={successBoxClasses}>
            Your password has been reset. You can now <Link href="/login" className="font-semibold underline">sign in</Link> with your new password.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="w-full">
              <label htmlFor="new-password" className="type-label mb-2 block text-neutral-500">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClasses}
                required
                minLength={8}
              />
            </div>

            <div className="w-full">
              <label htmlFor="confirm-password" className="type-label mb-2 block text-neutral-500">
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClasses}
                required
                minLength={8}
              />
            </div>

            {error && (
              <div className={errorBoxClasses} role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className={primaryButtonClasses}
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