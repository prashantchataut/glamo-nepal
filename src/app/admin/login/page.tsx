import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata = {
  title: "Admin Login — GLAMO NEPAL",
  description: "Protected GLAMO NEPAL administration login for store operations.",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-brand-primary-light px-4 py-10 text-brand-textPrimary md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[2.25rem] bg-brand-bgDark p-8 text-white shadow-editorial md:p-12">
          <div className="absolute inset-0">
            <div className="absolute right-0 top-0 h-1/2 w-1/2 rounded-full bg-brand-secondary/35 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-1/2 w-1/2 rounded-full bg-brand-gold/24 blur-3xl" />
          </div>
          <div className="relative z-10">
            <span className="font-label inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              GLAMO NEPAL Admin
            </span>
            <h1 className="mt-8 max-w-xl font-display text-5xl font-semibold leading-tight md:text-7xl">
              Manage beauty commerce with confidence.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
              A protected workspace for products, inventory, orders, customers, campaign banners and launch operations for GLAMO NEPAL.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-soft backdrop-blur md:p-8">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-16" aria-label="Loading admin login form">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-primary border-t-transparent" />
              <p className="mt-4 text-sm text-brand-textMuted">Loading admin login...</p>
            </div>
          }>
            <AdminLoginForm />
          </Suspense>
        </section>
      </div>
    </div>
  );
}