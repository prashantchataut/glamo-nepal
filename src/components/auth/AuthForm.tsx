"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { toast } from "sonner";
import { SITE_CONFIG } from "@/lib/config";
import { IMAGES } from "@/lib/image-library";
import { Button } from "@/components/ui/button";

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
  const { signIn } = useAuthActions();

  const [mode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const copy = labels[mode];

  const handleSubmit = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      if (mode === "register") {
        await signIn("password", {
          email,
          password,
          name,
          flow: "signUp",
        });
        toast.success("Account created successfully!");
      } else {
        await signIn("password", {
          email,
          password,
          flow: "signIn",
        });
        toast.success("Signed in successfully.");
      }
      const redirectTo = params.get("redirect") || "/account";
      router.push(redirectTo.startsWith("/") ? redirectTo : "/account");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed. Please try again.";
      if (message.includes("Invalid credentials") || message.includes("password")) {
        setError(mode === "register" ? "An account with this email may already exist." : "Invalid email or password.");
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [mode, email, password, name, signIn, router, params]);

  return (
    <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-editorial md:rounded-[2.75rem] md:grid-cols-[0.95fr_1.05fr]">
      <aside className="relative flex min-h-[260px] flex-col justify-end bg-neutral-900 p-6 text-white md:min-h-[420px] md:p-10 lg:p-12">
        <Image src={IMAGES.auth.loginSplit} alt="Editorial beauty portrait for GLAMO account access" fill className="object-cover opacity-55" sizes="(max-width: 768px) 100vw, 45vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/45 to-neutral-950/10" />
        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{copy.eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl font-light leading-tight tracking-tight md:text-5xl lg:text-6xl">{copy.title}</h1>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/75 md:mt-5">{copy.description}</p>
          <div className="mt-6 rounded-[1.25rem] border border-white/15 bg-neutral-950/45 p-3.5 text-sm leading-6 text-white/75 md:mt-8 md:p-4">
            <strong className="block text-white">Need help signing in?</strong>
            Contact GLAMO customer care at {SITE_CONFIG.phone}, or use the forgot password link below.
          </div>
        </div>
      </aside>

      <div className="space-y-5 p-5 md:p-10 lg:p-12">
        <div aria-live="polite" aria-atomic="true">
          {error && (
            <div className="rounded-[1.25rem] border border-error/30 bg-error/5 px-4 py-3 text-sm text-error" role="alert">
              {error}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-4 md:space-y-5"
        >
          {mode === "register" && (
            <div className="w-full">
              <label htmlFor="auth-name" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500 md:mb-2">
                Full name
              </label>
              <input
                id="auth-name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-[1rem] border border-neutral-200 bg-white px-4 py-3.5 text-base text-neutral-950 transition-colors duration-200 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 md:rounded-[1.15rem] md:py-3 md:text-sm"
                required={mode === "register"}
                autoComplete="name"
              />
            </div>
          )}

          <div className="w-full">
            <label htmlFor="auth-email" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500 md:mb-2">
              Email address
            </label>
            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[1rem] border border-neutral-200 bg-white px-4 py-3.5 text-base text-neutral-950 transition-colors duration-200 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 md:rounded-[1.15rem] md:py-3 md:text-sm"
              required
              autoComplete="email"
            />
          </div>

          <div className="w-full">
            <label htmlFor="auth-password" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500 md:mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[1rem] border border-neutral-200 bg-white px-4 py-3.5 pr-10 text-base text-neutral-950 transition-colors duration-200 placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 md:rounded-[1.15rem] md:py-3 md:text-sm"
                required
                minLength={8}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                aria-describedby={mode === "register" ? "auth-password-hint" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-neutral-400 transition-colors hover:text-primary"
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
              <p id="auth-password-hint" className="mt-1.5 text-[11px] tracking-wide text-neutral-400">
                Minimum 8 characters
              </p>
            )}
          </div>

          {mode === "login" && (
            <div className="pt-1 text-right md:pt-0">
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-neutral-900 transition-colors">
                Forgot password?
              </Link>
            </div>
          )}

          <Button type="submit" disabled={isLoading || !email || !password} className="mt-2 w-full">
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
      </div>
    </div>
  );
}