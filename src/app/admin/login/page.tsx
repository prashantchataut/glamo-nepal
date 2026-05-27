import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata = {
  title: "Sign In — GLAMO NEPAL",
  description: "Sign in to your workspace.",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-5xl items-center gap-0 md:grid-cols-[0.9fr_1.1fr]">
        <section className="relative overflow-hidden bg-neutral-900 p-8 text-white md:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="relative z-10">
            <span className="type-label inline-flex items-center gap-2 border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Secure Workspace
            </span>
            <h1 className="mt-8 max-w-xl font-display text-5xl font-semibold leading-tight md:text-7xl">
              Manage beauty commerce with confidence.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
              A protected workspace for operations and management.
            </p>
          </div>
        </section>

        <section className="border border-neutral-200 bg-white p-6 md:p-10">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-16" aria-label="Loading admin login form">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-4 text-sm text-neutral-400">Loading admin login...</p>
            </div>
          }>
            <AdminLoginForm />
          </Suspense>
        </section>
      </div>
    </div>
  );
}