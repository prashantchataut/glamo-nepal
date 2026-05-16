import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata = {
  title: "Admin Login — GLAMO NEPAL",
  description: "Protected GLAMO NEPAL administration login for store operations.",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { redirect?: string };
}) {
  const redirectTo = searchParams?.redirect?.startsWith("/admin") ? searchParams.redirect : "/admin";

  return (
    <div className="min-h-screen bg-cream-50 px-4 py-6 sm:py-10 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-stretch overflow-hidden border border-cream-200 bg-cream-50 shadow-editorial lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative min-h-[360px] overflow-hidden bg-ink p-7 text-white sm:p-10 lg:min-h-0 lg:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(242,212,218,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_55%)]" />
          <div className="relative z-10 flex h-full flex-col justify-center">
            <span className="inline-flex w-fit items-center gap-2 border border-white/15 bg-white/8 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              GLAMO NEPAL Admin
            </span>
            <h1 className="mt-8 max-w-xl font-display text-[clamp(3rem,8vw,5.8rem)] font-light leading-[0.95] tracking-[-0.045em] text-white">
              Manage beauty commerce with confidence.
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-7 text-white/70 md:text-base">
              A protected workspace for products, inventory, orders, customers, campaign banners and launch operations for GLAMO Nepal.
            </p>
          </div>
        </section>

        <section className="flex items-center bg-cream-50 p-6 sm:p-8 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <AdminLoginForm redirectTo={redirectTo} />
          </div>
        </section>
      </div>
    </div>
  );
}
