"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, ImageOff, PackageX, RotateCcw, ShoppingBag, Star, Truck } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { useAdminData } from "@/lib/hooks/useAdminData";

type Issue = { title: string; description: string; severity: "high" | "medium" | "low"; href: string; action: string; icon: typeof AlertTriangle };

function IssueCard({ issue }: { issue: Issue }) {
  const severityClass = issue.severity === "high" ? "border-admin-error/30 bg-admin-error-light" : issue.severity === "medium" ? "border-admin-warning/30 bg-admin-warning-light" : "border-brand-border bg-white";
  const Icon = issue.icon;
  return (
    <div className={`rounded-[1.5rem] border p-5 shadow-sm ${severityClass}`}>
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-white/70 p-2 text-brand-primary"><Icon size={18} /></div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-brand-textPrimary">{issue.title}</p>
          <p className="mt-1 text-sm leading-5 text-brand-textMuted">{issue.description}</p>
          <Link href={issue.href} className="mt-4 inline-flex rounded-full bg-brand-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white">{issue.action}</Link>
        </div>
      </div>
    </div>
  );
}

export function IssueCenterView() {
  const { data: stats, isLoading: statsLoading } = useAdminData(() => adminApi.dashboardStats());
  const { data: products, isLoading: productsLoading } = useAdminData(() => adminApi.listProducts({ limit: 100 }));
  const { data: banners } = useAdminData(() => adminApi.listAdminBanners());
  const { data: returns } = useAdminData(() => adminApi.listReturns({ limit: 50 }));
  const { data: reviews } = useAdminData(() => adminApi.listReviews({ limit: 100, isApproved: false }));

  const productList = products?.products ?? [];
  const bannerList = (banners ?? []) as Array<{ isActive?: boolean; imageUrl?: string; title?: string }>;
  const returnList = Array.isArray(returns) ? returns : [];
  const reviewList = Array.isArray(reviews) ? reviews : [];

  const missingImages = productList.filter((p) => !p.images || p.images.length === 0);
  const missingInfo = productList.filter((p) => !p.description || !p.meta_title || !p.meta_description || !p.attributes);
  const inactiveBanners = bannerList.filter((b) => !b.isActive || !b.imageUrl);
  const pendingReturns = returnList.filter((r) => ["REQUESTED", "APPROVED", "RECEIVED"].includes(r.status));
  const pendingReviews = reviewList.filter((r) => !r.isApproved);

  const issues: Issue[] = [];
  const toShip = Number(stats?.orderStatusBreakdown?.PENDING ?? 0) + Number(stats?.orderStatusBreakdown?.CONFIRMED ?? 0) + Number(stats?.orderStatusBreakdown?.PROCESSING ?? 0);
  if (toShip > 0) issues.push({ title: `${toShip} orders need fulfillment`, description: "Open these orders, confirm payment and move them through pick, pack and ship.", severity: "high", href: "/admin/orders", action: "Open orders", icon: ShoppingBag });
  const outOfStock = stats?.inventoryAlerts?.outOfStock ?? 0;
  if (outOfStock > 0) issues.push({ title: `${outOfStock} products are out of stock`, description: "Customers cannot buy these. Restock or hide them before they damage trust.", severity: "high", href: "/admin/inventory", action: "Fix stock", icon: PackageX });
  const lowStock = stats?.inventoryAlerts?.lowStock ?? 0;
  if (lowStock > 0) issues.push({ title: `${lowStock} products are low on stock`, description: "Prepare restock orders before fast-moving products sell out.", severity: "medium", href: "/admin/inventory", action: "Review inventory", icon: Truck });
  if (pendingReturns.length > 0) issues.push({ title: `${pendingReturns.length} returns need inspection`, description: "Beauty returns should stay quarantined until item condition and hygiene status are checked.", severity: "high", href: "/admin/returns", action: "Review returns", icon: RotateCcw });
  if (pendingReviews.length > 0) issues.push({ title: `${pendingReviews.length} reviews need moderation`, description: "Approve useful reviews and catch shade, irritation or damage patterns early.", severity: "medium", href: "/admin/reviews", action: "Moderate reviews", icon: Star });
  if (missingImages.length > 0) issues.push({ title: `${missingImages.length} products have no images`, description: "A product without photos looks broken to shoppers and should not be promoted.", severity: "high", href: "/admin/products", action: "Add images", icon: ImageOff });
  if (missingInfo.length > 0) issues.push({ title: `${missingInfo.length} products are missing selling details`, description: "Fill product description, SEO fields, ingredients or beauty attributes before publishing.", severity: "medium", href: "/admin/products", action: "Fix product info", icon: AlertTriangle });
  if (inactiveBanners.length > 0 || bannerList.length === 0) issues.push({ title: bannerList.length === 0 ? "Homepage has no banners" : `${inactiveBanners.length} banner slots need review`, description: "Update campaign banners so the homepage never looks unattended.", severity: "low", href: "/admin/content", action: "Open content", icon: ImageOff });

  const loading = statsLoading || productsLoading;

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
        <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Issue center</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">Plain-language problems to fix today.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-brand-textMuted">No database words, no mystery states. This page translates store risk into owner actions.</p>
      </section>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-36 animate-pulse rounded-[1.5rem] bg-white" />)}
        </div>
      ) : issues.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {issues.map((issue) => <IssueCard key={issue.title} issue={issue} />)}
        </section>
      ) : (
        <section className="rounded-[2rem] border border-brand-border bg-white p-10 text-center shadow-sm">
          <CheckCircle2 className="mx-auto text-admin-success" size={32} />
          <h3 className="mt-3 font-display text-xl font-semibold">No urgent issues found</h3>
          <p className="mt-1 text-sm text-brand-textMuted">Orders, stock, content and product readiness look healthy from the available data.</p>
        </section>
      )}
    </div>
  );
}
