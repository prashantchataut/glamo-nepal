"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateUserProfile,
} from "@/lib/firebase";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/lib/config";
import { IMAGES } from "@/lib/image-library";
import { useFirebaseAuth } from "./FirebaseAuthProvider";

export type AuthMode = "login" | "register";

const labels: Record<AuthMode, { eyebrow: string; title: string; description: string; button: string }> = {
  login: {
    eyebrow: "Welcome back",
    title: "Sign in to GLAMO",
    description: "Enter your email and password to access your account.",
    button: "Sign in",
  },
  register: {
    eyebrow: "Join GLAMO",
    title: "Create your beauty account",
    description: "Sign up with your email and a password. You can add your phone number at checkout.",
    button: "Create account",
  },
};

export function AuthForm({ mode: initialMode }: { mode: AuthMode }) {
  const router = useRouter();
  const params = useSearchParams();
  const { syncComplete } = useFirebaseAuth();
  const syncCompleteRef = useRef(syncComplete);
  syncCompleteRef.current = syncComplete;

  const [mode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const copy = labels[mode];
  const showGuestCheckout = params.get("prompt") === "guest";
  const redirectUrl = params.get("redirect") || "/account";

  const waitForSyncAndRedirect = async () => {
    const redirectTo = params.get("redirect") || "/account";
    const safeRedirect = /^\/[a-zA-Z0-9/_-]*(?:\?[a-zA-Z0-9_=&-]*)?$/.test(redirectTo) && !redirectTo.startsWith("//") ? redirectTo : "/account";

    const maxWait = 5000;
    const interval = 100;
    let elapsed = 0;
    while (!syncCompleteRef.current && elapsed < maxWait) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      elapsed += interval;
    }

    router.push(safeRedirect);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (mode === "register") {
        const cred = await createUserWithEmailAndPassword(email, password);
        if (cred.user && name) {
          try { await updateUserProfile(cred.user, { displayName: name }); } catch {}
        }
        toast.success("Account created successfully!");
      } else {
        await signInWithEmailAndPassword(email, password);
        toast.success("Signed in successfully.");
      }
      await waitForSyncAndRedirect();
    } catch (err: unknown) {
      if (err instanceof Error) {
        const code = (err as { code?: string }).code || "";
        if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else if (code === "auth/email-already-in-use") {
          setError("An account with this email already exists.");
        } else if (code === "auth/weak-password") {
          setError("Password must be at least 8 characters with a letter and a number.");
        } else if (code === "auth/invalid-email") {
          setError("Please enter a valid email address.");
        } else if (code === "auth/too-many-requests") {
          setError("Too many attempts. Please try again later.");
        } else if (code === "auth/network-request-failed") {
          setError("Network error. Please check your connection and try again.");
        } else if (code === "auth/operation-not-allowed") {
          setError("Sign-in method is not enabled. Please contact support.");
        } else {
          setError(`Sign-in failed: ${err.message || "Unknown error"}`);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
      console.error("[Auth] Sign-in error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);
    try {
      await signInWithPopup();
      toast.success("Signed in with Google.");
      await waitForSyncAndRedirect();
    } catch (err: unknown) {
      if (err instanceof Error) {
        const code = (err as { code?: string }).code || "";
        if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
          setIsLoading(false);
          return;
        }
        if (code === "auth/unauthorized-domain") {
          setError("This domain is not authorized for Google sign-in. Add it in Firebase Console.");
        } else if (code === "auth/operation-not-allowed") {
          setError("Google sign-in is not enabled. Enable it in Firebase Console.");
        } else {
          setError(err.message || "Google sign-in failed. Please try again.");
        }
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[1.5rem] border border-neutral-200/80 bg-white shadow-card md:rounded-[2.5rem] md:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative flex min-h-[260px] flex-col justify-end bg-neutral-900 p-6 text-white md:min-h-[460px] md:p-10 lg:p-14">
        <Image src={IMAGES.auth.loginSplit} alt="" fill className="object-cover opacity-50" sizes="(max-width: 768px) 100vw, 45vw" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/50 to-neutral-950/10" />
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary-light">{copy.eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-light leading-[0.95] tracking-tight md:text-5xl lg:text-6xl">{copy.title}</h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/70 md:mt-5">{copy.description}</p>
          <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-neutral-950/40 p-4 text-sm leading-6 text-white/65 md:mt-8">
            <strong className="block text-white/90">Need help signing in?</strong>
            Contact GLAMO customer care at {SITE_CONFIG.phone}, or use the forgot password link below.
          </div>
        </div>
      </aside>

      <div className="space-y-5 p-6 md:p-10 lg:p-14">
        <div aria-live="polite" aria-atomic="true">
          {error && (
            <div className="mb-5 rounded-2xl border border-error/20 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
              {error}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white px-6 py-3.5 text-sm font-semibold text-neutral-700 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.24 1.05-3.71 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-neutral-100" />
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-300">or</span>
          <div className="h-px flex-1 bg-neutral-100" />
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 md:space-y-5"
        >
          {mode === "register" && (
            <div className="space-y-2">
              <label htmlFor="auth-name" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                Full name
              </label>
              <input
                id="auth-name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-[15px] text-neutral-950 transition-all duration-200 placeholder:text-neutral-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                required={mode === "register"}
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="auth-email" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-[15px] text-neutral-950 transition-all duration-200 placeholder:text-neutral-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="auth-password" className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 pr-10 text-[15px] text-neutral-950 transition-all duration-200 placeholder:text-neutral-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                required
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                aria-describedby={mode === "register" ? "auth-password-hint" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-neutral-300 transition-colors hover:text-primary"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1L1 1"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {mode === "register" && (
              <p id="auth-password-hint" className="text-[11px] tracking-wide text-neutral-400">
                Minimum 8 characters, including a letter and a number
              </p>
            )}
          </div>

          {mode === "login" && (
            <div className="pt-1 text-right">
              <Link href="/forgot-password" className="text-sm font-medium text-primary transition-colors hover:text-primary-hover">
                Forgot password?
              </Link>
            </div>
          )}

          <button type="submit" disabled={isLoading || !email || !password} className="mt-2 w-full rounded-full bg-neutral-950 px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-all duration-200 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400">
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Please wait...
              </span>
            ) : (
              copy.button
            )}
          </button>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-1 text-sm font-medium">
            {mode === "login" && (
              <Link href="/register" className="text-primary transition-colors hover:text-primary-hover">
                Create account
              </Link>
            )}
            {mode === "register" && (
              <Link href="/login" className="text-primary transition-colors hover:text-primary-hover">
                Sign in instead
              </Link>
            )}
          </div>

          {showGuestCheckout && (
            <div className="mt-5 border-t border-neutral-100 pt-5 text-center">
              <p className="mb-3 text-xs text-neutral-400">Or continue without an account</p>
              <Link
                href={redirectUrl.startsWith("/checkout") ? `${redirectUrl}${redirectUrl.includes("?") ? "&" : "?"}guest=true` : "/checkout?guest=true"}
                className="inline-block w-full rounded-full border border-neutral-200 bg-white px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-600 transition-all duration-200 hover:border-neutral-300 hover:bg-neutral-50"
              >
                Continue as guest
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}