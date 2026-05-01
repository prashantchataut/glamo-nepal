"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Download,
  Eye,
  Filter,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MoreHorizontal,
  Package,
  Pencil,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Trash2,
  Truck,
  Upload,
  Users,
  X,
} from "lucide-react";
import { PRODUCTS } from "@/lib/data/products";
import { INVENTORY_SNAPSHOT, INVENTORY_SUMMARY, LOW_STOCK_SNAPSHOT, type InventoryRisk } from "@/lib/data/inventory";
import { MOCK_ORDERS, type Order } from "@/lib/data/orders";
import { SITE_CONFIG } from "@/lib/constants";
import { cn, formatNpr } from "@/lib/utils";

type AdminSection = "dashboard" | "products" | "orders" | "inventory" | "banners" | "customers" | "analytics" | "settings";
type BannerSlot = "desktop" | "mobile";

type ManagedBanner = {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  desktopImage: string;
  mobileImage: string;
  status: "Published" | "Scheduled" | "Paused";
  updatedAt: string;
};

const sections: Array<{ id: AdminSection; label: string; icon: ComponentType<{ size?: number; className?: string }> }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "inventory", label: "Stocks", icon: Boxes },
  { id: "banners", label: "Banners", icon: ImageIcon },
  { id: "customers", label: "Customers", icon: Users },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

const defaultBanners: ManagedBanner[] = [
  {
    id: "hero-new-year",
    title: "New Year 2083 Beauty Edit",
    subtitle: "Fresh skincare, soft glam makeup and giftable beauty picks curated for Nepal.",
    cta: "Shop New Year Offers",
    href: "/collections/festival-ready",
    desktopImage: "/images/promo-new-year.svg",
    mobileImage: "/images/hero-glow.svg",
    status: "Published",
    updatedAt: "2026-05-01",
  },
  {
    id: "store-visit",
    title: "Visit GLAMO NEPAL in Naya Baneshwor",
    subtitle: "Find us at Mantra In & Out Square, Kathmandu.",
    cta: "Get Directions",
    href: "/contact",
    desktopImage: "/images/promo-store.svg",
    mobileImage: "/images/hero-nepal.svg",
    status: "Published",
    updatedAt: "2026-05-01",
  },
];

const riskStyles: Record<InventoryRisk, string> = {
  healthy: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  watch: "bg-amber-50 text-amber-700 ring-amber-100",
  low: "bg-red-50 text-red-700 ring-red-100",
  out: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

const orderStatusStyles: Record<Order["status"], string> = {
  Pending: "bg-amber-50 text-amber-700 ring-amber-100",
  Confirmed: "bg-sky-50 text-sky-700 ring-sky-100",
  Processing: "bg-violet-50 text-violet-700 ring-violet-100",
  Shipped: "bg-blue-50 text-blue-700 ring-blue-100",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Cancelled: "bg-red-50 text-red-700 ring-red-100",
};

const bannerStorageKey = "glamo-admin-managed-banners";
const allowedBannerTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function StatCard({ label, value, note, icon: Icon }: { label: string; value: string | number; note: string; icon: ComponentType<{ size?: number; className?: string }> }) {
  return (
    <div className="rounded-[1.5rem] border border-brand-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="rounded-2xl bg-brand-primary-light p-3 text-brand-primary">
          <Icon size={20} />
        </div>
        <span className="rounded-full bg-brand-bgLight px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-textMuted">Live view</span>
      </div>
      <p className="mt-5 text-sm font-medium text-brand-textMuted">{label}</p>
      <p className="mt-1 font-serif text-3xl font-semibold text-brand-textPrimary">{value}</p>
      <p className="mt-2 text-xs leading-5 text-brand-textMuted">{note}</p>
    </div>
  );
}

function StatusPill({ children, className }: { children: ReactNode; className: string }) {
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1", className)}>{children}</span>;
}

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-brand-textPrimary">{label}</span>
        <span className="text-brand-textMuted">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-brand-bgLight">
        <div className="h-2 rounded-full bg-brand-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function BannerPreview({ banner }: { banner: ManagedBanner }) {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-white/20 bg-brand-bgDark text-white shadow-lg">
      <div className="grid min-h-[220px] md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center p-6 md:p-8">
          <span className="w-fit rounded-full bg-white/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">{banner.status}</span>
          <h3 className="mt-4 font-serif text-3xl font-semibold leading-tight md:text-4xl">{banner.title}</h3>
          <p className="mt-3 text-sm leading-6 text-white/72">{banner.subtitle}</p>
          <Link href={banner.href} className="mt-5 w-fit rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-primary">
            {banner.cta}
          </Link>
        </div>
        <div className="relative min-h-[220px] bg-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner.desktopImage} alt="Banner preview" className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [orderStatusById, setOrderStatusById] = useState<Record<string, Order["status"]>>({});
  const [banners, setBanners] = useState<ManagedBanner[]>(defaultBanners);
  const [selectedBannerId, setSelectedBannerId] = useState(defaultBanners[0].id);
  const [bannerMessage, setBannerMessage] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(bannerStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ManagedBanner[];
        if (Array.isArray(parsed) && parsed.length > 0) setBanners(parsed);
      } catch {
        window.localStorage.removeItem(bannerStorageKey);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(bannerStorageKey, JSON.stringify(banners));
  }, [banners]);

  const selectedBanner = banners.find((banner) => banner.id === selectedBannerId) || banners[0];
  const grossSales = MOCK_ORDERS.reduce((sum, order) => sum + order.total, 0);
  const inventoryValue = PRODUCTS.reduce((sum, product) => sum + product.price * product.stockCount, 0);
  const lowStockCount = INVENTORY_SUMMARY.lowStockCount;
  const productSearch = productQuery.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (!productSearch) return PRODUCTS;
    return PRODUCTS.filter((product) => [product.name, product.brand, product.category, product.subCategory, product.sku].join(" ").toLowerCase().includes(productSearch));
  }, [productSearch]);

  const orderRows = MOCK_ORDERS.map((order) => ({ ...order, status: orderStatusById[order.id] || order.status }));
  const categoryCounts = PRODUCTS.reduce<Record<string, number>>((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {});
  const maxCategoryCount = Math.max(...Object.values(categoryCounts));
  const topProducts = [...PRODUCTS].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 5);

  function updateBannerField(field: keyof ManagedBanner, value: string) {
    setBanners((current) => current.map((banner) => banner.id === selectedBanner.id ? { ...banner, [field]: value, updatedAt: new Date().toISOString().slice(0, 10) } : banner));
  }

  async function handleBannerUpload(event: ChangeEvent<HTMLInputElement>, slot: BannerSlot) {
    const file = event.target.files?.[0];
    setUploadError("");
    setBannerMessage("");
    if (!file) return;
    if (!allowedBannerTypes.includes(file.type)) {
      setUploadError("Use PNG, JPG, WebP or SVG only.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadError("Keep banner files under 3 MB for faster mobile loading.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      if (file.type === "image/svg+xml") {
        updateBannerField(slot === "desktop" ? "desktopImage" : "mobileImage", result);
        setBannerMessage("SVG banner uploaded. Check preview on desktop and mobile before publishing.");
        return;
      }

      const image = new Image();
      image.onload = () => {
        const ratio = image.width / image.height;
        const isDesktopRatioValid = ratio >= 2 && ratio <= 2.6;
        const isMobileRatioValid = ratio >= 0.75 && ratio <= 1.05;
        const isValid = slot === "desktop" ? isDesktopRatioValid : isMobileRatioValid;
        if (!isValid) {
          setUploadError(slot === "desktop" ? "Desktop banners should be close to 16:7. Recommended: 1920 x 840." : "Mobile banners should be close to 4:5. Recommended: 1080 x 1350.");
          return;
        }
        updateBannerField(slot === "desktop" ? "desktopImage" : "mobileImage", result);
        setBannerMessage(`${slot === "desktop" ? "Desktop" : "Mobile"} banner uploaded and ratio checked.`);
      };
      image.onerror = () => setUploadError("The selected image could not be read.");
      image.src = result;
    };
    reader.readAsDataURL(file);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => null);
    window.location.href = "/admin/login";
  }

  function exportProductsCsv() {
    const rows = [["sku", "name", "brand", "category", "price_npr", "stock", "status"], ...PRODUCTS.map((product) => [product.sku, product.name, product.brand, product.category, String(product.price), String(product.stockCount), product.inStock ? "active" : "out_of_stock"])]
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","));
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "glamo-products-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#f5eff6] text-brand-textPrimary">
      <aside className={cn("fixed inset-y-0 left-0 z-50 w-[292px] border-r border-brand-border bg-white/95 shadow-xl backdrop-blur transition-transform lg:translate-x-0", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-brand-border px-6 py-6">
            <Link href="/admin" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-lg shadow-brand-primary/25">
                <SparklesIcon />
              </div>
              <div>
                <p className="font-serif text-2xl font-semibold leading-none">GLAMO</p>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-textMuted">Admin panel</p>
              </div>
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="rounded-xl p-2 text-brand-textMuted hover:bg-brand-bgLight lg:hidden" aria-label="Close admin menu">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setIsSidebarOpen(false);
                  }}
                  className={cn("flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition", activeSection === section.id ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "text-brand-textMuted hover:bg-brand-bgLight hover:text-brand-textPrimary")}
                >
                  <Icon size={18} />
                  {section.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-brand-border p-4">
            <Link href="/" className="mb-3 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-brand-textMuted transition hover:bg-brand-bgLight hover:text-brand-primary">
              <Eye size={18} /> View storefront
            </Link>
            <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50">
              <LogOut size={18} /> {isLoggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      </aside>

      {isSidebarOpen ? <button aria-label="Close menu overlay" className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setIsSidebarOpen(false)} /> : null}

      <div className="lg:pl-[292px]">
        <header className="sticky top-0 z-30 border-b border-brand-border bg-white/86 px-4 py-4 backdrop-blur md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className="rounded-2xl border border-brand-border bg-white p-3 text-brand-textPrimary lg:hidden" aria-label="Open admin menu">
                <Menu size={20} />
              </button>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Store operations</p>
                <h1 className="font-serif text-2xl font-semibold md:text-3xl">{sections.find((item) => item.id === activeSection)?.label}</h1>
              </div>
            </div>
            <div className="hidden flex-1 items-center justify-center md:flex">
              <div className="relative w-full max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-textMuted" size={18} />
                <input className="w-full rounded-full border border-brand-border bg-brand-bgLight py-3 pl-11 pr-4 text-sm outline-none transition focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10" placeholder="Search products, orders or customers" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 md:inline-flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Open for order
              </span>
              <button className="rounded-2xl border border-brand-border bg-white p-3 text-brand-textMuted transition hover:text-brand-primary" aria-label="Notifications">
                <Bell size={18} />
              </button>
              <div className="hidden items-center gap-3 rounded-full bg-white py-1.5 pl-2 pr-4 shadow-sm md:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">GA</div>
                <div className="leading-tight">
                  <p className="text-sm font-bold">GLAMO Admin</p>
                  <p className="text-xs text-brand-textMuted">admin@glamonepal.com</p>
                </div>
                <ChevronDown size={16} className="text-brand-textMuted" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {activeSection === "dashboard" ? (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-[2rem] bg-brand-bgDark text-white shadow-[0_35px_110px_-60px_rgba(26,10,30,0.9)]">
                <div className="grid gap-6 p-6 md:p-8 xl:grid-cols-[1fr_0.78fr] xl:items-center">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/75"><ShieldCheck size={15} /> Protected workspace</span>
                    <h2 className="mt-6 font-serif text-4xl font-semibold leading-tight md:text-6xl">Welcome to GLAMO NEPAL admin.</h2>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-white/72 md:text-base">Manage catalog quality, order flow, inventory risks and homepage banners from one polished operating panel.</p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button onClick={() => setActiveSection("products")} className="rounded-full bg-white px-5 py-3 text-sm font-bold text-brand-primary">Manage products</button>
                      <button onClick={() => setActiveSection("banners")} className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white">Replace banners</button>
                    </div>
                  </div>
                  <BannerPreview banner={selectedBanner} />
                </div>
              </section>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={Users} label="Customers" value="26" note="Seeded customer view until customer API is connected" />
                <StatCard icon={Package} label="Products" value={PRODUCTS.length} note={`${PRODUCTS.filter((product) => product.madeInNepal).length} Made in Nepal picks`} />
                <StatCard icon={ShoppingBag} label="Orders" value={MOCK_ORDERS.length} note={`${formatNpr(grossSales)} sample order value`} />
                <StatCard icon={AlertTriangle} label="Stock watch" value={lowStockCount} note={`${INVENTORY_SUMMARY.totalUnits} total units in catalog`} />
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm md:p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-3xl font-semibold">Order history</h3>
                      <p className="text-sm text-brand-textMuted">Track payment method, status and fulfillment priority.</p>
                    </div>
                    <button onClick={() => setActiveSection("orders")} className="rounded-full border border-brand-border px-4 py-2 text-sm font-bold text-brand-primary">View all</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[740px] text-sm">
                      <thead>
                        <tr className="border-y border-brand-border bg-brand-bgLight text-left text-xs uppercase tracking-[0.14em] text-brand-textMuted">
                          <th className="px-4 py-3">Order</th><th>Customer</th><th>Payment</th><th>Total</th><th>Status</th><th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderRows.map((order) => (
                          <tr key={order.id} className="border-b border-brand-border/70 last:border-0">
                            <td className="px-4 py-4 font-mono text-xs font-semibold text-brand-textPrimary">{order.orderNumber}</td>
                            <td>{order.shippingAddress.split(",")[0]}</td>
                            <td>{order.paymentMethod}</td>
                            <td className="font-bold">{formatNpr(order.total)}</td>
                            <td><StatusPill className={orderStatusStyles[order.status]}>{order.status}</StatusPill></td>
                            <td><button aria-label="Open order actions" className="rounded-full p-2 text-brand-textMuted hover:bg-brand-bgLight"><MoreHorizontal size={18} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
                    <h3 className="font-serif text-3xl font-semibold">Top categories</h3>
                    <div className="mt-5 space-y-4">
                      {Object.entries(categoryCounts).map(([category, count]) => <MiniBar key={category} label={category} value={count} max={maxCategoryCount} />)}
                    </div>
                  </div>
                  <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
                    <h3 className="font-serif text-3xl font-semibold">Low-stock alerts</h3>
                    <div className="mt-4 space-y-3">
                      {LOW_STOCK_SNAPSHOT.slice(0, 4).map((item) => (
                        <div key={item.productId} className="flex items-center justify-between gap-3 rounded-2xl bg-brand-bgLight p-3 text-sm">
                          <div>
                            <p className="font-bold text-brand-textPrimary">{item.name}</p>
                            <p className="text-xs text-brand-textMuted">Reorder at {item.reorderPoint}</p>
                          </div>
                          <StatusPill className={riskStyles[item.risk]}>{item.stockCount}</StatusPill>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {activeSection === "products" ? (
            <section className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-serif text-4xl font-semibold">Product management</h2>
                  <p className="mt-1 text-sm text-brand-textMuted">Search, review and prepare SKUs for real catalog APIs.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button className="inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2.5 text-sm font-bold text-brand-textPrimary"><Filter size={16} /> Filter</button>
                  <button onClick={exportProductsCsv} className="inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2.5 text-sm font-bold text-brand-textPrimary"><Download size={16} /> Export</button>
                  <button className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2.5 text-sm font-bold text-white"><Plus size={16} /> Add product</button>
                </div>
              </div>
              <div className="relative mt-5 max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-textMuted" size={18} />
                <input value={productQuery} onChange={(event) => setProductQuery(event.target.value)} className="w-full rounded-full border border-brand-border bg-brand-bgLight py-3 pl-11 pr-4 text-sm outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10" placeholder="Search by SKU, brand or product" />
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[1050px] text-sm">
                  <thead>
                    <tr className="border-y border-brand-border bg-brand-bgLight text-left text-xs uppercase tracking-[0.14em] text-brand-textMuted">
                      <th className="px-4 py-3">Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const inventory = INVENTORY_SNAPSHOT.find((item) => item.productId === product.id);
                      const status = product.stockCount <= 0 ? "Out" : product.stockCount <= (inventory?.reorderPoint || 10) ? "Low" : "Active";
                      return (
                        <tr key={product.id} className="border-b border-brand-border/70 last:border-0">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={product.image} alt="" className="h-12 w-12 rounded-2xl bg-brand-bgLight object-cover" />
                              <div>
                                <p className="font-bold text-brand-textPrimary">{product.name}</p>
                                <p className="text-xs text-brand-textMuted">{product.brand}</p>
                              </div>
                            </div>
                          </td>
                          <td className="font-mono text-xs">{product.sku}</td>
                          <td className="capitalize">{product.category}</td>
                          <td className="font-bold">{formatNpr(product.price)}</td>
                          <td>{product.stockCount} pcs</td>
                          <td><StatusPill className={status === "Active" ? "bg-emerald-50 text-emerald-700 ring-emerald-100" : status === "Low" ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-red-50 text-red-700 ring-red-100"}>{status}</StatusPill></td>
                          <td>
                            <div className="flex gap-2">
                              <button aria-label="View product" className="rounded-full p-2 text-brand-textMuted hover:bg-brand-bgLight"><Eye size={17} /></button>
                              <button aria-label="Edit product" className="rounded-full p-2 text-brand-textMuted hover:bg-brand-bgLight"><Pencil size={17} /></button>
                              <button aria-label="Delete product" className="rounded-full p-2 text-red-500 hover:bg-red-50"><Trash2 size={17} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === "orders" ? (
            <section className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm md:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div><h2 className="font-serif text-4xl font-semibold">Orders</h2><p className="mt-1 text-sm text-brand-textMuted">Update statuses for COD, Khalti, eSewa and card orders.</p></div>
                <div className="flex flex-wrap gap-3"><button className="rounded-full border border-brand-border px-4 py-2.5 text-sm font-bold">Today</button><button className="rounded-full border border-brand-border px-4 py-2.5 text-sm font-bold">This week</button><button className="rounded-full bg-brand-primary px-4 py-2.5 text-sm font-bold text-white">Create manual order</button></div>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead><tr className="border-y border-brand-border bg-brand-bgLight text-left text-xs uppercase tracking-[0.14em] text-brand-textMuted"><th className="px-4 py-3">Order</th><th>Date</th><th>Items</th><th>Payment</th><th>Address</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>{orderRows.map((order) => (
                    <tr key={order.id} className="border-b border-brand-border/70 last:border-0">
                      <td className="px-4 py-4 font-mono text-xs font-bold">{order.orderNumber}</td><td>{order.date}</td><td>{order.items.length}</td><td>{order.paymentMethod}</td><td className="max-w-[260px] truncate">{order.shippingAddress}</td><td className="font-bold">{formatNpr(order.total)}</td>
                      <td><select value={order.status} onChange={(event) => setOrderStatusById((current) => ({ ...current, [order.id]: event.target.value as Order["status"] }))} className="rounded-full border border-brand-border bg-white px-3 py-2 text-xs font-bold outline-none"><option>Pending</option><option>Confirmed</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === "inventory" ? (
            <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
              <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm md:p-6">
                <h2 className="font-serif text-4xl font-semibold">Stock control</h2>
                <p className="mt-1 text-sm text-brand-textMuted">Monitor stock, reorder points and estimated cover.</p>
                <div className="mt-5 grid gap-4 md:grid-cols-3"><StatCard icon={Boxes} label="Total units" value={INVENTORY_SUMMARY.totalUnits} note="Available catalog units" /><StatCard icon={AlertTriangle} label="Low stock" value={INVENTORY_SUMMARY.lowStockCount} note="Needs reorder review" /><StatCard icon={Store} label="Inventory value" value={formatNpr(inventoryValue)} note="Current retail value" /></div>
                <div className="mt-6 space-y-3">
                  {LOW_STOCK_SNAPSHOT.map((item) => <div key={item.productId} className="grid gap-3 rounded-2xl border border-brand-border p-4 md:grid-cols-[1fr_auto_auto] md:items-center"><div><p className="font-bold">{item.name}</p><p className="text-xs text-brand-textMuted">{item.sku} · Reorder {item.reorderPoint} · Target {item.restockTarget}</p></div><StatusPill className={riskStyles[item.risk]}>{item.risk}</StatusPill><button className="rounded-full bg-brand-primary px-4 py-2 text-xs font-bold text-white">Restock</button></div>)}
                </div>
              </div>
              <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm"><h3 className="font-serif text-3xl font-semibold">Inventory rules</h3><div className="mt-5 space-y-4 text-sm text-brand-textMuted"><p className="flex gap-3"><CheckCircle2 className="mt-0.5 text-emerald-600" size={18} /> Best sellers should trigger reorder at 30 units.</p><p className="flex gap-3"><CheckCircle2 className="mt-0.5 text-emerald-600" size={18} /> Show customer-safe availability labels only.</p><p className="flex gap-3"><AlertTriangle className="mt-0.5 text-amber-600" size={18} /> Connect inventory ledger before accepting real orders.</p></div></div>
            </section>
          ) : null}

          {activeSection === "banners" ? (
            <section className="grid gap-6 xl:grid-cols-[1fr_0.76fr]">
              <div className="space-y-6">
                <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm md:p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="font-serif text-4xl font-semibold">Banner manager</h2><p className="mt-1 text-sm text-brand-textMuted">Replace homepage and campaign banners with adaptive desktop and mobile assets.</p></div><button onClick={() => setBannerMessage("Banner settings saved in this browser. Connect the admin API to publish across devices.")} className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-3 text-sm font-bold text-white"><Save size={16} /> Save banner</button></div>
                  <div className="mt-5 grid gap-3 md:grid-cols-2">{banners.map((banner) => <button key={banner.id} onClick={() => setSelectedBannerId(banner.id)} className={cn("rounded-2xl border p-4 text-left transition", selectedBanner.id === banner.id ? "border-brand-primary bg-brand-primary-light" : "border-brand-border bg-white hover:bg-brand-bgLight")}><p className="font-bold">{banner.title}</p><p className="mt-1 text-xs text-brand-textMuted">{banner.status} · Updated {banner.updatedAt}</p></button>)}</div>
                </div>
                <BannerPreview banner={selectedBanner} />
                <div className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm md:p-6">
                  <h3 className="font-serif text-3xl font-semibold">Edit selected banner</h3>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <label className="text-sm font-semibold">Title<input value={selectedBanner.title} onChange={(event) => updateBannerField("title", event.target.value)} className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary" /></label>
                    <label className="text-sm font-semibold">CTA text<input value={selectedBanner.cta} onChange={(event) => updateBannerField("cta", event.target.value)} className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary" /></label>
                    <label className="text-sm font-semibold md:col-span-2">Subtitle<textarea value={selectedBanner.subtitle} onChange={(event) => updateBannerField("subtitle", event.target.value)} className="mt-2 min-h-[100px] w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary" /></label>
                    <label className="text-sm font-semibold">Link<input value={selectedBanner.href} onChange={(event) => updateBannerField("href", event.target.value)} className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary" /></label>
                    <label className="text-sm font-semibold">Status<select value={selectedBanner.status} onChange={(event) => updateBannerField("status", event.target.value as ManagedBanner["status"])} className="mt-2 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary"><option>Published</option><option>Scheduled</option><option>Paused</option></select></label>
                  </div>
                </div>
              </div>
              <aside className="space-y-6">
                <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm"><Upload className="text-brand-primary" /><h3 className="mt-3 font-serif text-3xl font-semibold">Upload assets</h3><p className="mt-2 text-sm leading-6 text-brand-textMuted">Desktop: 16:7 ratio, recommended 1920 x 840. Mobile: 4:5 ratio, recommended 1080 x 1350. PNG, JPG, WebP and SVG are accepted. Keep files under 3 MB.</p><div className="mt-5 space-y-3"><label className="block rounded-2xl border border-dashed border-brand-primary/40 bg-brand-primary-light p-4 text-sm font-bold text-brand-primary cursor-pointer"><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleBannerUpload(event, "desktop")} className="hidden" />Upload desktop banner</label><label className="block rounded-2xl border border-dashed border-brand-primary/40 bg-brand-primary-light p-4 text-sm font-bold text-brand-primary cursor-pointer"><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleBannerUpload(event, "mobile")} className="hidden" />Upload mobile banner</label></div>{uploadError ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{uploadError}</p> : null}{bannerMessage ? <p className="mt-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{bannerMessage}</p> : null}</div>
                <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm"><Smartphone className="text-brand-primary" /><h3 className="mt-3 font-serif text-3xl font-semibold">Responsive rules</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-brand-textMuted"><li>Keep text inside the center safe area.</li><li>Use separate desktop and mobile crops.</li><li>Avoid tiny text inside image files; use admin title/subtitle fields.</li><li>Test at mobile, tablet and desktop widths before publishing.</li></ul></div>
              </aside>
            </section>
          ) : null}

          {activeSection === "customers" ? (
            <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm"><h2 className="font-serif text-4xl font-semibold">Customers</h2><p className="mt-1 text-sm text-brand-textMuted">Customer records will connect to the backend user and order APIs. The panel is ready for saved addresses, order value and contact preferences.</p><div className="mt-6 grid gap-4 md:grid-cols-3"><StatCard icon={Users} label="Total customers" value="26" note="Seeded admin count" /><StatCard icon={Mail} label="Newsletter leads" value="14" note="Waiting for email provider" /><StatCard icon={MapPin} label="Kathmandu area" value="18" note="Primary delivery cluster" /></div></section>
          ) : null}

          {activeSection === "analytics" ? (
            <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]"><div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm"><h2 className="font-serif text-4xl font-semibold">Analytics</h2><p className="mt-1 text-sm text-brand-textMuted">Operational view of categories and product attention.</p><div className="mt-6 space-y-5">{Object.entries(categoryCounts).map(([category, count]) => <MiniBar key={category} label={category} value={count} max={maxCategoryCount} />)}</div></div><div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm"><h3 className="font-serif text-3xl font-semibold">Top viewed products</h3><div className="mt-5 space-y-4">{topProducts.map((product) => <MiniBar key={product.id} label={product.name} value={product.reviewsCount} max={topProducts[0]?.reviewsCount || 1} />)}</div></div></section>
          ) : null}

          {activeSection === "settings" ? (
            <section className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm"><h2 className="font-serif text-4xl font-semibold">Store settings</h2><p className="mt-1 text-sm text-brand-textMuted">Business constants for GLAMO NEPAL.</p><div className="mt-6 grid gap-4 md:grid-cols-2"><SettingItem icon={Store} label="Store" value={SITE_CONFIG.fullTitle} /><SettingItem icon={MapPin} label="Address" value={SITE_CONFIG.address} /><SettingItem icon={Smartphone} label="Phone" value={SITE_CONFIG.phone} /><SettingItem icon={CreditCard} label="Payments" value={SITE_CONFIG.paymentMethods.join(", ")} /><SettingItem icon={Truck} label="Free shipping" value="NPR 2,500" /><SettingItem icon={ShieldCheck} label="Instagram" value={`${SITE_CONFIG.instagramHandle} · ${SITE_CONFIG.social.instagram}`} /></div></section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function SettingItem({ icon: Icon, label, value }: { icon: ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return <div className="rounded-2xl border border-brand-border bg-brand-bgLight p-4"><div className="flex items-start gap-3"><Icon className="mt-0.5 text-brand-primary" size={18} /><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-textMuted">{label}</p><p className="mt-1 text-sm font-semibold text-brand-textPrimary">{value}</p></div></div></div>;
}

function SparklesIcon() {
  return <span className="font-serif text-xl font-bold">G</span>;
}
