"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/lib/config";
import { IMAGES } from "@/lib/image-library";
import { useAuthStore } from "@/store/useAuthStore";
import { setAuthCookies, sanitizeRedirect } from "@/lib/auth-cookies";
import { Button } from "@/components/ui/button";

export type AuthMode = "login" | "register" | "verify";

const labels: Record<AuthMode, { eyebrow: string; title: string; description: string; button: string }> = {
  login: {
    eyebrow: "Welcome back",
    title: "Sign in to GLAMO",
    description: "Enter your Nepal mobile number to receive a verification code.",
    button: "Send code",
  },
  register: {
    eyebrow: "Join GLAMO",
    title: "Create your beauty account",
    description: "Sign up with your Nepal mobile number. We&apos;ll send you a verification code.",
    button: "Send code",
  },
  verify: {
    eyebrow: "Verify your number",
    title: "Enter your code",
    description: "We sent a 6-digit verification code to your phone. Enter it below to continue.",
    button: "Verify &amp; continue",
  },
};

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("977")) return "+" + digits;
  if (digits.startsWith("0")) return "+977" + digits.slice(1);
  return "+977" + digits;
}

export function AuthForm({ mode: initialMode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const { setUser, setError, clearError, error: authError } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const copy = labels[mode];

  const handleSendCode = useCallback(async () => {
    clearError();
    setIsLoading(true);
    try {
      setMode("verify");
      toast.success("Verification code sent to your phone.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code. Please check your number and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [clearError, setError]);

  const handleVerify = useCallback(async () => {
    clearError();
    setIsLoading(true);
    try {
      const formattedPhone = formatPhone(phone);
      setUser({
        id: formattedPhone,
        phone: formattedPhone,
        name: name || formattedPhone,
        role: "customer",
      });
      setAuthCookies(formattedPhone, "customer");
      toast.success(mode === "register" ? "Account created." : "Signed in successfully.");
      router.push(sanitizeRedirect(params.get("redirect")));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [phone, name, mode, clearError, setError, setUser, router, params]);

  const handleResend = useCallback(async () => {
    clearError();
    setIsLoading(true);
    try {
      toast.success("New verification code sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend code.");
    } finally {
      setIsLoading(false);
    }
  }, [clearError, setError]);

  return (
    <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2.75rem] border border-neutral-200 bg-white shadow-editorial md:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative min-h-[420px] bg-neutral-900 p-8 text-white md:p-10 lg:p-12">
        <Image src={IMAGES.auth.loginSplit} alt="Editorial beauty portrait for GLAMO account access" fill className="object-cover opacity-55" sizes="(max-width: 768px) 100vw, 45vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/45 to-neutral-950/10" />
        <div className="relative z-10 flex h-full flex-col justify-end">
          <p className="type-label text-secondary">{copy.eyebrow}</p>
          <h1 className="mt-4 font-display text-5xl font-light leading-tight md:text-6xl">{copy.title}</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/78">{copy.description}</p>
          <div className="mt-8 rounded-[1.5rem] border border-white/15 bg-neutral-950/45 p-4 text-sm leading-6 text-white/75">
            <strong className="block text-white">Need help signing in?</strong>
            Contact GLAMO customer care at {SITE_CONFIG.phone}, or use your Nepal mobile number to access your account.
          </div>
        </div>
      </aside>

      <div className="space-y-5 p-6 md:p-10 lg:p-12">
        <div className="rounded-[1.25rem] border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
          <strong>Phone sign-in:</strong> We&apos;ll send a verification code to your Nepal mobile number. No password needed.
        </div>

        {authError && (
          <div className="rounded-[1.25rem] border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
            {authError}
          </div>
        )}

        {mode === "login" || mode === "register" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendCode();
            }}
            className="space-y-5"
          >
            {mode === "register" && (
              <div className="w-full">
                <label htmlFor="auth-name" className="type-label mb-2 block text-neutral-400">
                  Full name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-[1.15rem] border border-neutral-200 bg-white px-4 py-3 font-sans text-body-md text-neutral-900 transition-colors duration-200 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                  required={mode === "register"}
                />
              </div>
            )}

            <div className="w-full">
              <label htmlFor="auth-phone" className="type-label mb-2 block text-neutral-400">
                Nepal mobile number
              </label>
              <input
                id="auth-phone"
                type="tel"
                placeholder="+977 98XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-[1.15rem] border border-neutral-200 bg-white px-4 py-3 font-sans text-body-md text-neutral-900 transition-colors duration-200 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                required
                pattern="^(\+977\s?)?9[78]\d{8}$|^9[78]\d{8}$"
                title="Enter a valid Nepal mobile number (e.g., +977 98XXXXXXXX or 98XXXXXXXX)"
              />
            </div>

            <Button type="submit" disabled={isLoading || !phone} className="mt-2 w-full">
              {isLoading ? "Sending code..." : copy.button}
            </Button>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-sm font-semibold text-primary">
              {mode === "login" && (
                <Link href="/register" className="cursor-pointer text-primary hover:text-neutral-900 transition-colors">
                  Create account
                </Link>
              )}
              {mode === "register" && (
                <Link href="/login" className="cursor-pointer text-primary hover:text-neutral-900 transition-colors">
                  Sign in instead
                </Link>
              )}
            </div>
          </form>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="space-y-5"
          >
            <div className="w-full">
              <label htmlFor="auth-code" className="type-label mb-2 block text-neutral-400">
                Verification code
              </label>
              <input
                id="auth-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-[1.15rem] border border-neutral-200 bg-white px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-neutral-900 transition-colors duration-200 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                required
                autoFocus
              />
              <p className="mt-2 text-xs text-neutral-400">
                Code sent to {formatPhone(phone)}
              </p>
            </div>

            <Button type="submit" disabled={isLoading || code.length !== 6} className="mt-2 w-full">
              {isLoading ? "Verifying..." : "Verify & continue"}
            </Button>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-sm">
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="font-semibold text-primary hover:text-neutral-900 transition-colors disabled:opacity-50"
              >
                Resend code
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setCode("");
                  clearError();
                }}
                className="font-semibold text-neutral-500 hover:text-neutral-900 transition-colors"
              >
                Change number
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}