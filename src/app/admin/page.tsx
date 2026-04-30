import Link from "next/link";
import { AlertTriangle, BarChart3, Boxes, ClipboardCheck, Megaphone, PackageCheck, ShieldAlert, Sparkles } from "lucide-react";
import { StatusCard } from "@/components/common/StatusCard";
import { PRODUCTS, NEPAL_MARKET_REFERENCE_NOTES } from "@/lib/data/products";
import { INVENTORY_SNAPSHOT, INVENTORY_SUMMARY, LOW_STOCK_SNAPSHOT, type InventoryRisk } from "@/lib/data/inventory";
import { getPublicEnvChecks } from "@/lib/env";
import { MOCK_ORDERS } from "@/lib/data/orders";
import { cn, formatNpr } from "@/lib/utils";

const riskStyles: Record<InventoryRisk, string> = {
  healthy: "bg-emerald-50 text-emerald-700",
  watch: "bg-amber-50 text-amber-700",
  low: "bg-red-50 text-red-700",
  out: "bg-zinc-100 text-zinc-600",
};

export default function AdminPage() {
  const inventoryValue = PRODUCTS.reduce((sum, product) => sum + product.price * product.stockCount, 0);
  const madeInNepalCount = PRODUCTS.filter((product) => product.madeInNepal).length;
  const saleCount = PRODUCTS.filter((product) => product.originalPrice && product.originalPrice > product.price).length;
  const envChecks = getPublicEnvChecks();

  return (
    <main className="bg-brand-bgLight py-10 md:py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
          <div className="flex gap-3">
            <ShieldAlert className="mt-0.5 shrink-0" />
            <div>
              <strong className="block">Frontend-only admin mock.</strong>
              <p className="mt-1 text-sm leading-6">
                Admin routing now requires a mock admin role cookie, but real authentication, server-side authorization, RBAC, audit logs and API permissions are required before production.
              </p>
              <p className="mt-2 text-xs font-semibold">Demo admin login: admin@glamonepal.com with any 8+ character password.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Admin shell</p>
            <h1 className="mt-2 font-serif text-4xl font-semibold text-brand-textPrimary md:text-6xl">GLAMO operations dashboard</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-textMuted">
              Mock inventory, source-audit notes, campaign status and stock-risk signals for owner review before backend integration.
            </p>
          </div>
          <Link href="/shop" className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-bgDark">
            View storefront
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard icon={Boxes} label="Products" value={PRODUCTS.length} note={`${madeInNepalCount} Made in Nepal mock SKUs`} />
          <StatusCard icon={AlertTriangle} label="Stock watch" value={INVENTORY_SUMMARY.lowStockCount} note={`${INVENTORY_SUMMARY.totalUnits} total mock units`} />
          <StatusCard icon={BarChart3} label="Inventory value" value={formatNpr(inventoryValue)} note="Mock retail value" />
          <StatusCard icon={PackageCheck} label="Orders" value={MOCK_ORDERS.length} note={`${saleCount} sale-price SKUs`} />
        </div>

        <section className="mt-8 rounded-[2rem] border border-border/70 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Production environment checklist</h2>
              <p className="mt-1 text-sm text-brand-textMuted">Frontend-safe environment readiness. Payment and auth secrets must stay server-side.</p>
            </div>
            <span className="rounded-full bg-brand-bgLight px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">Owner action needed</span>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {envChecks.map((check) => (
              <div key={check.key} className="rounded-2xl border border-border/70 bg-brand-bgLight p-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-brand-textPrimary">{check.label}</p>
                  <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]", check.status === "configured" ? "bg-emerald-50 text-emerald-700" : check.status === "placeholder" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>{check.status}</span>
                </div>
                <p className="mt-2 font-mono text-[11px] text-brand-textMuted">{check.key}</p>
                <p className="mt-2 text-xs leading-5 text-brand-textMuted">{check.ownerAction}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-[2rem] border border-border/70 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Inventory table</h2>
                <p className="mt-1 text-sm text-brand-textMuted">All mock SKUs with stock risk, reorder point, days cover and NPR retail value.</p>
              </div>
              <button className="rounded-full border border-brand-primary px-5 py-2 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white">
                Export mock CSV
              </button>
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.16em] text-brand-textMuted">
                    <th className="py-3">SKU</th>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Stock</th>
                    <th>Reorder</th>
                    <th>Days cover</th>
                    <th>Price</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {PRODUCTS.map((product) => {
                    const stock = INVENTORY_SNAPSHOT.find((item) => item.productId === product.id);
                    return (
                      <tr key={product.id} className="border-b border-border/60 last:border-0">
                        <td className="py-3 font-mono text-xs text-brand-textMuted">{product.sku}</td>
                        <td className="font-semibold text-brand-textPrimary">{product.name}</td>
                        <td>{product.brand}</td>
                        <td className="capitalize">{product.category}</td>
                        <td className="font-semibold">{product.stockCount}</td>
                        <td>{stock?.reorderPoint}</td>
                        <td>{stock?.estimatedDaysCover}</td>
                        <td className="font-semibold text-brand-gold">{formatNpr(product.price)}</td>
                        <td>
                          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", riskStyles[stock?.risk ?? "healthy"])}>
                            {stock?.risk || "healthy"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-border/70 bg-white p-5 shadow-sm md:p-6">
              <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Reorder watchlist</h2>
              <div className="mt-4 space-y-3">
                {LOW_STOCK_SNAPSHOT.slice(0, 12).map((item) => (
                  <div key={item.productId} className="rounded-2xl bg-brand-bgLight p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-brand-textPrimary">{item.name}</span>
                      <strong className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">{item.stockCount}</strong>
                    </div>
                    <p className="mt-1 text-xs text-brand-textMuted">
                      Reorder at {item.reorderPoint} · target {item.restockTarget} · {item.estimatedDaysCover} days cover
                    </p>
                  </div>
                ))}
              </div>
            </section>
            <section className="rounded-[2rem] border border-border/70 bg-brand-bgDark p-6 text-white shadow-sm">
              <Megaphone className="text-brand-gold" />
              <h2 className="mt-3 font-serif text-3xl font-semibold">Campaign status</h2>
              <p className="mt-2 text-sm leading-6 text-white/72">
                Dashain sale banner is config-driven and ready to support Tihar, Teej and wedding-season campaigns.
              </p>
            </section>
            <section className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm">
              <ClipboardCheck className="text-brand-primary" />
              <h2 className="mt-3 font-serif text-3xl font-semibold text-brand-textPrimary">Source/audit status</h2>
              <p className="mt-2 text-sm leading-6 text-brand-textMuted">
                Mock catalog uses original GLAMO descriptions and local neutral placeholder art. Supplier-approved images and product claims are still required.
              </p>
              <ul className="mt-4 space-y-2 text-xs leading-5 text-brand-textMuted">
                {NEPAL_MARKET_REFERENCE_NOTES.map((note) => (
                  <li key={note}>• {note}</li>
                ))}
              </ul>
            </section>
            <section className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm">
              <Sparkles className="text-brand-gold" />
              <h2 className="mt-3 font-serif text-3xl font-semibold text-brand-textPrimary">Next backend hooks</h2>
              <p className="mt-2 text-sm leading-6 text-brand-textMuted">
                Replace mock stock with paginated inventory, real order states, role-scoped admin APIs, supplier audit status and event logs.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
