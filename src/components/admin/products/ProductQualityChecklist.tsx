"use client";

import Link from "next/link";
import { CheckCircle2, ImageOff, ListChecks, Search, ShieldAlert } from "lucide-react";
import { adminApi, type AdminProduct } from "@/lib/api/admin";
import { useAdminData } from "@/lib/hooks/useAdminData";

function readiness(product: AdminProduct) {
  const checks = [
    Boolean(product.name && product.slug),
    Boolean(product.base_price > 0),
    Boolean(product.images && product.images.length > 0),
    Boolean(product.description || product.short_description),
    Boolean(product.meta_title && product.meta_description),
    Boolean(product.attributes && Object.keys(product.attributes).length > 0),
    product.track_inventory ? product.stock_quantity > 0 : true,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

function missingReason(product: AdminProduct): string {
  if (!product.images || product.images.length === 0) return "Missing product photos";
  if (!product.description && !product.short_description) return "Missing description";
  if (!product.meta_title || !product.meta_description) return "Missing search preview text";
  if (!product.attributes || Object.keys(product.attributes).length === 0) return "Missing beauty details like skin type, shade, ingredients or claims";
  if (product.track_inventory && product.stock_quantity <= 0) return "No sellable stock";
  if (!product.base_price || product.base_price <= 0) return "Missing price";
  return "Ready to publish";
}

export function ProductQualityChecklist() {
  const { data, isLoading } = useAdminData(() => adminApi.listProducts({ limit: 100 }));
  const products = data?.products ?? [];
  const weak = products
    .map((product) => ({ product, score: readiness(product), reason: missingReason(product) }))
    .filter((item) => item.score < 100)
    .sort((a, b) => a.score - b.score)
    .slice(0, 8);
  const readyCount = products.filter((product) => readiness(product) === 100).length;
  const average = products.length ? Math.round(products.reduce((sum, product) => sum + readiness(product), 0) / products.length) : 0;

  return (
    <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Product readiness</p>
          <h2 className="mt-2 font-display text-2xl font-semibold">Can customers confidently buy these products?</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-brand-textMuted">This catches owner-facing product gaps before a product is promoted: photos, stock, descriptions, SEO preview and beauty-specific details.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-brand-bgLight p-3"><p className="text-xs text-brand-textMuted">Average</p><p className="text-xl font-semibold">{isLoading ? "—" : `${average}%`}</p></div>
          <div className="rounded-xl bg-brand-bgLight p-3"><p className="text-xs text-brand-textMuted">Ready</p><p className="text-xl font-semibold">{readyCount}</p></div>
          <div className="rounded-xl bg-brand-bgLight p-3"><p className="text-xs text-brand-textMuted">Needs work</p><p className="text-xl font-semibold">{weak.length}</p></div>
        </div>
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-brand-bgLight" />)}</div>
        ) : weak.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {weak.map(({ product, score, reason }) => (
              <Link key={product.id} href={`/admin/products?search=${encodeURIComponent(product.name)}`} className="rounded-[1.25rem] border border-brand-border p-4 transition hover:bg-brand-bgLight">
                <div className="flex items-start justify-between gap-3">
                  <div>{score < 50 ? <ShieldAlert className="text-admin-error" size={18} /> : <ListChecks className="text-admin-warning" size={18} />}</div>
                  <span className="rounded-full bg-brand-bgLight px-2 py-1 text-xs font-bold text-brand-textMuted">{score}%</span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-semibold">{product.name}</p>
                <p className="mt-1 text-xs leading-5 text-brand-textMuted">{reason}</p>
              </Link>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="rounded-[1.25rem] border border-brand-border bg-brand-bgLight p-5 text-center"><CheckCircle2 className="mx-auto text-admin-success" size={24} /><p className="mt-2 text-sm font-semibold">All checked products look publish-ready.</p></div>
        ) : (
          <div className="rounded-[1.25rem] border border-brand-border bg-brand-bgLight p-5 text-center"><ImageOff className="mx-auto text-brand-textMuted" size={24} /><p className="mt-2 text-sm font-semibold">No products found yet.</p><Link href="/admin/products" className="mt-3 inline-flex rounded-full bg-brand-primary px-4 py-2 text-xs font-bold text-white"><Search size={13} /> Add products</Link></div>
        )}
      </div>
    </section>
  );
}
