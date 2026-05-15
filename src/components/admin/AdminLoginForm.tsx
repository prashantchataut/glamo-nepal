"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, Sparkles } from "lucide-react";

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
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white">
          <Sparkles size={20} />
        </div>
        <div>
          <h2 className="font-display text-3xl font-semibold">Admin login</h2>
          <p className="text-sm text-brand-textMuted">Use your GLAMO admin credentials.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <label className="block text-sm font-semibold text-brand-textPrimary">
          Admin email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@glamonepal.com"
            autoComplete="username"
            className="mt-2 w-full rounded-2xl border border-brand-border bg-white px-4 py-4 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
            required
          />
        </label>

        <label className="block text-sm font-semibold text-brand-textPrimary">
          Password
          <span className="relative mt-2 block">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-textMuted" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-2xl border border-brand-border bg-white py-4 pl-12 pr-12 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 flex items-center justify-center rounded-full text-brand-textMuted transition hover:text-brand-primary"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>

        {error ? <p role="alert" className="rounded-2xl border border-admin-error/20 bg-admin-error-light px-4 py-3 text-sm font-medium text-admin-error">{error}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[44px] rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5 hover:bg-brand-bgDark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in to admin"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl bg-brand-bgLight p-4 text-xs leading-6 text-brand-textMuted">
        Access is protected by a signed, HTTP-only admin session cookie. For deployment, set <strong>ADMIN_EMAIL</strong>, <strong>ADMIN_PASSWORD</strong> and <strong>ADMIN_SESSION_SECRET</strong> in your environment.
      </div>
    </>
  );
}
