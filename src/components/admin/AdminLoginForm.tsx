"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(() => searchParams.get("redirect") || "/admin", [searchParams]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const csrfToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("glamo-csrf-token="))
        ?.split("=")[1] || "";
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null;
      if (!response.ok || !payload?.ok) {
        setError(payload?.message || "Admin sign in failed.");
        return;
      }
      router.push(redirectTo.startsWith("/admin") ? redirectTo : "/admin");
      router.refresh();
    } catch {
      setError("Unable to reach the admin login service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center bg-primary text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <h2 className="font-display text-3xl font-semibold text-neutral-900">Sign in</h2>
          <p className="text-sm text-neutral-500">Use your workspace credentials.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="w-full">
          <label htmlFor="admin-email" className="type-label mb-2 block text-neutral-400">Email</label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter email"
            autoComplete="username"
            className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-3 font-sans text-body-md text-neutral-900 transition-colors duration-200 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
            required
          />
        </div>

        <div className="w-full">
          <label htmlFor="admin-password" className="type-label mb-2 block text-neutral-400">Password</label>
          <div className="relative">
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-3 pr-10 font-sans text-body-md text-neutral-900 transition-colors duration-200 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-neutral-400 transition-colors hover:text-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error ? <p role="alert" className="border border-error/30 bg-error/5 px-4 py-3 text-sm font-medium text-error">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-press w-full min-h-[44px] bg-primary px-6 py-3 text-[13px] font-medium uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-6 bg-neutral-50 p-4 text-xs leading-6 text-neutral-500">
        Access is protected by a signed, HTTP-only session cookie.
      </div>
    </>
  );
}