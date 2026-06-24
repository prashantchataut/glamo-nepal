import Link from "next/link";
import { ClipboardList, LockKeyhole, RotateCcw, ShieldCheck, Store, TriangleAlert } from "lucide-react";

const checks = [
  {
    title: "Beauty return hygiene",
    detail: "Returned cosmetics and skincare must stay quarantined unless sealed and inspected.",
    href: "/admin/returns",
    action: "Review returns",
    icon: RotateCcw,
  },
  {
    title: "Product claims and ingredients",
    detail: "Skin concerns, claims and INCI fields should be clear before publishing sensitive beauty products.",
    href: "/admin/products",
    action: "Check products",
    icon: ClipboardList,
  },
  {
    title: "Customer trust signals",
    detail: "Moderate reviews for medical claims, allergic reactions and repeated shade mismatch patterns.",
    href: "/admin/reviews",
    action: "Moderate reviews",
    icon: ShieldCheck,
  },
  {
    title: "Admin accountability",
    detail: "Use audit logs to trace product, order, customer and settings changes in plain language.",
    href: "/admin/audit",
    action: "Open audit log",
    icon: LockKeyhole,
  },
];

export function ComplianceView() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Compliance and security</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Operational guardrails for a real beauty store</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-textMuted">
              This page links the working modules that reduce risk: safe returns, accurate product information, review moderation and traceable admin actions.
            </p>
          </div>
          <div className="rounded-2xl bg-admin-warning-light p-4 text-sm text-admin-warning">
            <div className="flex gap-2 font-semibold"><TriangleAlert size={16} /> Owner note</div>
            <p className="mt-1 text-xs leading-5">Do not restock opened or used beauty products. Make the safe path the default.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {checks.map((check) => {
          const Icon = check.icon;
          return (
            <article key={check.title} className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-bgLight text-brand-primary">
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{check.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-brand-textMuted">{check.detail}</p>
                  <Link href={check.href} className="mt-4 inline-flex rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white">
                    {check.action}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <Store className="mt-1 text-brand-primary" size={22} />
          <div>
            <h3 className="font-display text-lg font-semibold">Settings that affect checkout</h3>
            <p className="mt-2 text-sm leading-6 text-brand-textMuted">
              Delivery fees, COD behavior and payment settings belong in Settings. The order backend now avoids assuming optional fee columns exist, so customers can still place orders while the database catches up.
            </p>
            <Link href="/admin/settings" className="mt-4 inline-flex rounded-full border border-brand-border px-4 py-2 text-sm font-semibold text-brand-primary">
              Open settings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
