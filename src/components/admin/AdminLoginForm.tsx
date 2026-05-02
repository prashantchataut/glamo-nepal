"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

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
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <div className="min-h-screen bg-[#f8eef5] px-4 py-10 text-brand-textPrimary md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[2.25rem] bg-brand-bgDark p-8 text-white shadow-[0_35px_120px_-55px_rgba(26,10,30,0.85)] md:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,160,215,0.35),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(201,168,76,0.24),transparent_28%)]" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              <ShieldCheck size={15} /> GLAMO NEPAL Admin
            </span>
            <h1 className="mt-8 max-w-xl font-serif text-5xl font-semibold leading-[0.95] md:text-7xl">
              Manage beauty commerce with confidence.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/72 md:text-base">
              A protected workspace for products, inventory, orders, customers, campaign banners and launch operations for GLAMO NEPAL.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Products", "44 SKUs"],
                ["Orders", "Live workflow"],
                ["Banners", "Adaptive uploads"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.16em] text-white/58">{label}</p>
                  <p className="mt-2 font-serif text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_25px_80px_-45px_rgba(139,58,143,0.6)] backdrop-blur md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-serif text-3xl font-semibold">Admin login</h2>
              <p className="text-sm text-brand-textMuted">Use your GLAMO admin credentials.</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className="block text-sm font-semibold text-brand-textPrimary">
              Admin email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@glamonepal.com"
                autoComplete="username"
                className="mt-2 w-full rounded-2xl border border-brand-border bg-white px-4 py-3 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
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
                  className="w-full rounded-2xl border border-brand-border bg-white py-3 pl-12 pr-12 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-textMuted transition hover:text-brand-primary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/20 transition hover:-translate-y-0.5 hover:bg-brand-bgDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in to admin"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-brand-bgLight p-4 text-xs leading-6 text-brand-textMuted">
            Access is protected by a signed, HTTP-only admin session cookie. For deployment, set <strong>ADMIN_EMAIL</strong>, <strong>ADMIN_PASSWORD</strong> and <strong>ADMIN_SESSION_SECRET</strong> in your environment.
          </div>
        </section>
      </div>
    </div>
  );
}
