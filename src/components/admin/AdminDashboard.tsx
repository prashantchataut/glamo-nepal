"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import Link from "next/link";
import NextImage from "next/image";
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
import DOMPurify from "dompurify";
import { PRODUCTS } from "@/lib/data/products";
import { INVENTORY_SNAPSHOT, INVENTORY_SUMMARY, LOW_STOCK_SNAPSHOT, type InventoryRisk } from "@/lib/data/inventory";
import { MOCK_ORDERS, type Order } from "@/lib/data/orders";
import { SITE_CONFIG } from "@/lib/config";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";
import { cn, formatNPR } from "@/lib/utils";
import { ComingSoonTooltip } from "@/components/ui/ComingSoonTooltip";

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

const sections: Array<{ id: AdminSection; label: string; icon: ComponentType<{ size?: number | string; className?: string }> }> = [
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
  healthy: "bg-admin-success-light text-admin-success ring-admin-success/20",
  watch: "bg-admin-warning-light text-admin-warning ring-admin-warning/20",
  low: "bg-admin-error-light text-admin-error ring-admin-error/20",
  out: "bg-admin-neutral-light text-admin-neutral ring-admin-neutral/20",
};

const orderStatusStyles: Record<Order["status"], string> = {
  Pending: "bg-admin-warning-light text-admin-warning ring-admin-warning/20",
  Confirmed: "bg-admin-info-light text-admin-info ring-admin-info/20",
  Processing: "bg-violet-50 text-violet-700 ring-violet-100",
  Shipped: "bg-admin-info-light text-admin-info ring-admin-info/20",
  Delivered: "bg-admin-success-light text-admin-success ring-admin-success/20",
  Cancelled: "bg-admin-error-light text-admin-error ring-admin-error/20",
};

const bannerStorageKey = "glamo-admin-managed-banners";
const allowedBannerTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function sanitizeSvg(svgString: string): string {
  return DOMPurify.sanitize(svgString, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
}

function StatCard({ label, value, note, icon: Icon }: { label: string; value: string | number; note: string; icon: ComponentType<{ size?: number | string; className?: string }> }) {
  return (
    <div className="card-hover rounded-2xl border border-brand-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="rounded-xl bg-brand-primary-light p-3 text-brand-primary">
          <Icon size={18} />
        </div>
        <span className="font-label rounded-full bg-brand-bgLight px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-textMuted">Live</span>
      </div>
      <p className="mt-4 text-xs font-medium text-brand-textMuted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-textPrimary">{value}</p>
      <p className="mt-2 text-xs leading-4 text-brand-textMuted">{note}</p>
    </div>
  );
}

function StatusPill({ children, className }: { children: ReactNode; className: string }) {
  return <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1", className)}>{children}</span>;
}

function MiniBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-brand-textPrimary">{label}</span>
        <span className="text-brand-textMuted">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-brand-bgLight">
        <div className="h-1.5 rounded-full bg-brand-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function BannerPreview({ banner }: { banner: ManagedBanner }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/20 bg-brand-bgDark text-white shadow-lg">
      <div className="grid min-h-[180px] md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center p-5 md:p-6">
          <span className="font-label w-fit rounded-full bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/75">{banner.status}</span>
          <h3 className="mt-3 font-display text-2xl font-semibold leading-tight md:text-3xl">{banner.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">{banner.subtitle}</p>
          <Link href={banner.href} className="mt-4 w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-primary">
            {banner.cta}
          </Link>
        </div>
        <div className="relative min-h-[180px] bg-white/10">
          <NextImage src={banner.desktopImage} alt="Banner preview" fill className="object-cover" sizes="(max-width: 768px) 100vw, 40vw" unoptimized />
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
  const grossSales = useMemo(() => MOCK_ORDERS.reduce((sum, order) => sum + order.total, 0), []);
  const inventoryValue = useMemo(() => PRODUCTS.reduce((sum, product) => sum + product.price * product.stockCount, 0), []);
  const lowStockCount = INVENTORY_SUMMARY.lowStockCount;
  const productSearch = productQuery.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (!productSearch) return PRODUCTS;
    return PRODUCTS.filter((product) => [product.name, product.brand, product.category, product.subCategory, product.sku].join(" ").toLowerCase().includes(productSearch));
  }, [productSearch]);

  const orderRows = MOCK_ORDERS.map((order) => ({ ...order, status: orderStatusById[order.id] || order.status }));
  const categoryCounts = useMemo(() => PRODUCTS.reduce<Record<string, number>>((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1;
    return acc;
  }, {}), []);
  const maxCategoryCount = Math.max(...Object.values(categoryCounts));
  const topProducts = useMemo(() => [...PRODUCTS].sort((a, b) => b.reviewsCount - a.reviewsCount).slice(0, 5), []);

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
        const sanitized = sanitizeSvg(result);
        updateBannerField(slot === "desktop" ? "desktopImage" : "mobileImage", sanitized);
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
    <div className="min-h-screen bg-brand-bgLight text-brand-textPrimary">
      <aside role="navigation" aria-label="Admin navigation" className={cn("fixed inset-y-0 left-0 z-navbar w-[280px] border-r border-brand-border bg-white/95 shadow-xl backdrop-blur transition-transform lg:translate-x-0", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-brand-border px-6 py-6">
            <Link href="/admin" className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-md shadow-brand-primary/20">
                <SparklesIcon />
              </div>
              <div>
                <p className="font-display text-xl font-semibold leading-none">GLAMO</p>
                <p className="font-label mt-1 text-xs font-bold uppercase tracking-[0.18em] text-brand-textMuted">Admin panel</p>
              </div>
            </Link>
            <button onClick={() => setIsSidebarOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-textMuted hover:bg-brand-bgLight lg:hidden" aria-label="Close admin menu">
              <X size={18} />
            </button>
          </div>

          <nav role="tablist" className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  role="tab"
                  aria-selected={activeSection === section.id}
                  onClick={() => {
                    setActiveSection(section.id);
                    setIsSidebarOpen(false);
                  }}
                  className={cn("btn-press flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-sm font-medium transition", activeSection === section.id ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20" : "text-brand-textMuted hover:bg-brand-bgLight hover:text-brand-textPrimary")}
                >
                  <Icon size={17} />
                  {section.label}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-brand-border p-4">
            <Link href="/" className="mb-1 flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-brand-textMuted transition hover:bg-brand-bgLight hover:text-brand-primary">
              <Eye size={17} /> View storefront
            </Link>
            <button onClick={handleLogout} className="btn-press flex w-full items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-admin-error transition hover:bg-admin-error-light">
              <LogOut size={17} /> {isLoggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      </aside>

      {isSidebarOpen && <button aria-label="Close menu overlay" className="fixed inset-0 z-admin-overlay bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <div className="lg:pl-[280px]">
        <header role="banner" className="sticky top-0 z-admin-header border-b border-brand-border bg-white/95 px-4 py-4 backdrop-blur-lg md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-textPrimary shadow-sm lg:hidden" aria-label="Open admin menu">
                <Menu size={18} />
              </button>
              <div>
                <p className="font-label text-xs font-bold uppercase tracking-[0.18em] text-brand-primary">Store operations</p>
                <h1 className="font-display text-xl font-semibold md:text-2xl">{sections.find((item) => item.id === activeSection)?.label}</h1>
              </div>
            </div>
            <div className="hidden flex-1 items-center justify-center md:flex">
              <div className="relative w-full max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-textMuted" size={16} />
                <input aria-label="Search orders and products" className="w-full rounded-xl border border-brand-border bg-brand-bgLight py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" placeholder="Search products, orders or customers" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-2 rounded-full bg-admin-success-light px-3 py-2 text-xs font-bold text-admin-success md:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-admin-success" /> Open
              </span>
              <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border bg-white text-brand-textMuted transition hover:text-brand-primary shadow-sm" aria-label="Notifications">
                <Bell size={16} />
              </button>
              <div className="hidden items-center gap-2 rounded-xl bg-white py-2 pl-2 pr-3 shadow-sm md:flex">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">GA</div>
                <div className="leading-tight">
                  <p className="text-xs font-semibold">GLAMO Admin</p>
                </div>
                <ChevronDown size={14} className="text-brand-textMuted" />
              </div>
            </div>
          </div>
        </header>

        <main id="admin-content" aria-label="Admin dashboard" className="p-4 md:p-6 space-y-6">
          {activeSection === "dashboard" ? (
            <div className="space-y-6">
              <section className="overflow-hidden rounded-2xl bg-brand-bgDark text-white shadow-lg">
                <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[1fr_0.78fr] xl:items-center">
                  <div>
                    <span className="font-label inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75"><ShieldCheck size={14} /> Protected workspace</span>
                    <h2 className="mt-4 font-display text-2xl font-semibold leading-tight md:text-4xl">Welcome to GLAMO NEPAL admin.</h2>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">Manage catalog quality, order flow, inventory risks and homepage banners from one operating panel.</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button onClick={() => setActiveSection("products")} className="btn-press rounded-full bg-white px-4 py-3 text-sm font-bold text-brand-primary">Manage products</button>
                      <button onClick={() => setActiveSection("banners")} className="btn-press rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white">Replace banners</button>
                    </div>
                  </div>
                  <BannerPreview banner={selectedBanner} />
                </div>
              </section>

              <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard icon={Users} label="Customers" value="26" note="Seeded customer view until API connected" />
                <StatCard icon={Package} label="Products" value={PRODUCTS.length} note={`${PRODUCTS.filter((product) => product.madeInNepal).length} Made in Nepal picks`} />
                <StatCard icon={ShoppingBag} label="Orders" value={MOCK_ORDERS.length} note={`${formatNPR(grossSales)} sample order value`} />
                <StatCard icon={AlertTriangle} label="Stock watch" value={lowStockCount} note={`${INVENTORY_SUMMARY.totalUnits} total units`} />
              </section>

              <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-xl font-semibold">Order history</h3>
                      <p className="mt-1 text-sm text-brand-textMuted">Track payment, status and fulfillment.</p>
                    </div>
                    <button onClick={() => setActiveSection("orders")} className="btn-press rounded-full border border-brand-border px-4 py-2 text-sm font-bold text-brand-primary min-h-[44px]">View all</button>
                  </div>
                  <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full min-w-[700px] text-sm">
                      <caption className="sr-only">Recent orders</caption>
                      <thead>
                        <tr className="font-label border-y border-brand-border bg-brand-bgLight text-left text-xs uppercase tracking-[0.14em] text-brand-textMuted">
                          <th scope="col" className="px-4 py-3">Order</th><th scope="col" className="px-4 py-3">Customer</th><th scope="col" className="px-4 py-3">Payment</th><th scope="col" className="px-4 py-3">Total</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderRows.map((order) => (
                          <tr key={order.id} className="border-b border-brand-border/70 last:border-0">
                            <td className="px-4 py-4 font-mono text-xs font-semibold text-brand-textPrimary">{order.orderNumber}</td>
                            <td className="px-4 py-4">{order.shippingAddress.split(",")[0]}</td>
                            <td className="px-4 py-4">{order.paymentMethod}</td>
                            <td className="px-4 py-4 font-bold">{formatNPR(order.total)}</td>
                            <td className="px-4 py-4"><StatusPill className={orderStatusStyles[order.status]}>{order.status}</StatusPill></td>
                            <td className="px-4 py-4"><button aria-label="Open order actions" className="flex h-11 w-11 items-center justify-center rounded-full text-brand-textMuted hover:bg-brand-bgLight"><MoreHorizontal size={16} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="card-hover rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
                    <h3 className="font-display text-xl font-semibold">Top categories</h3>
                    <div className="mt-4 space-y-4">
                      {Object.entries(categoryCounts).map(([category, count]) => <MiniBar key={category} label={category} value={count} max={maxCategoryCount} />)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
                    <h3 className="font-display text-xl font-semibold">Low-stock alerts</h3>
                    <div className="mt-4 space-y-3">
                      {LOW_STOCK_SNAPSHOT.slice(0, 4).map((item) => (
                        <div key={item.productId} className="flex items-center justify-between gap-3 rounded-xl bg-brand-bgLight p-3 text-sm">
                          <div>
                            <p className="font-semibold text-brand-textPrimary">{item.name}</p>
                            <p className="text-[11px] text-brand-textMuted">Reorder at {item.reorderPoint}</p>
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
            <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-semibold">Product management</h2>
                  <p className="mt-1 text-sm text-brand-textMuted">Search, review and prepare SKUs for catalog APIs.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ComingSoonTooltip><button disabled className="btn-press inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-textPrimary disabled:opacity-50 disabled:cursor-not-allowed"><Filter size={15} /> Filter</button></ComingSoonTooltip>
                  <button onClick={exportProductsCsv} className="btn-press inline-flex items-center gap-2 rounded-full border border-brand-border px-4 py-2 text-sm font-medium text-brand-textPrimary"><Download size={15} /> Export</button>
                  <ComingSoonTooltip><button disabled className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed"><Plus size={15} /> Add product</button></ComingSoonTooltip>
                </div>
              </div>
              <div className="relative mt-4 max-w-lg">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-textMuted" size={16} />
                <input aria-label="Search products by SKU, brand or name" value={productQuery} onChange={(event) => setProductQuery(event.target.value)} className="w-full rounded-xl border border-brand-border bg-brand-bgLight py-3 pl-10 pr-4 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" placeholder="Search by SKU, brand or product" />
              </div>
              <div className="mt-4 overflow-x-auto -mx-6 px-6">
                <table className="w-full min-w-[900px] text-sm">
                  <caption className="sr-only">Product catalog</caption>
                  <thead>
                    <tr className="font-label border-y border-brand-border bg-brand-bgLight text-left text-xs uppercase tracking-[0.14em] text-brand-textMuted">
                      <th scope="col" className="px-4 py-3">Product</th><th scope="col" className="px-4 py-3">SKU</th><th scope="col" className="px-4 py-3">Category</th><th scope="col" className="px-4 py-3">Price</th><th scope="col" className="px-4 py-3">Stock</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => {
                      const inventory = INVENTORY_SNAPSHOT.find((item) => item.productId === product.id);
                      const status = product.stockCount <= 0 ? "Out" : product.stockCount <= (inventory?.reorderPoint || 10) ? "Low" : "Active";
                      return (
                        <tr key={product.id} className="border-b border-brand-border/70 last:border-0">
<td className="px-4 py-4">
                             <div className="flex items-center gap-4">
                               <NextImage src={product.image} alt="" width={40} height={40} className="h-10 w-10 rounded-xl bg-brand-bgLight object-cover" />
                               <div>
                                 <p className="font-semibold text-brand-textPrimary">{product.name}</p>
                                 <p className="text-xs text-brand-textMuted">{product.brand}</p>
                              </div>
                            </div>
                          </td>
<td className="px-4 py-4 font-mono text-xs">{product.sku}</td>
                           <td className="px-4 py-4 capitalize">{product.category}</td>
                           <td className="px-4 py-4 font-semibold">{formatNPR(product.price)}</td>
                           <td className="px-4 py-4">{product.stockCount} pcs</td>
<td className="px-4 py-4"><StatusPill className={status === "Active" ? "bg-admin-success-light text-admin-success ring-admin-success/20" : status === "Low" ? "bg-admin-warning-light text-admin-warning ring-admin-warning/20" : "bg-admin-error-light text-admin-error ring-admin-error/20"}>{status}</StatusPill></td>
                           <td className="px-4 py-4">
                             <div className="flex gap-1">
                               <ComingSoonTooltip><button disabled aria-label="View product" className="flex h-11 w-11 items-center justify-center rounded-lg text-brand-textMuted hover:bg-brand-bgLight disabled:opacity-50 disabled:cursor-not-allowed"><Eye size={15} /></button></ComingSoonTooltip>
                               <ComingSoonTooltip><button disabled aria-label="Edit product" className="flex h-11 w-11 items-center justify-center rounded-lg text-brand-textMuted hover:bg-brand-bgLight disabled:opacity-50 disabled:cursor-not-allowed"><Pencil size={15} /></button></ComingSoonTooltip>
                               <ComingSoonTooltip><button disabled aria-label="Delete product" className="flex h-11 w-11 items-center justify-center rounded-lg text-admin-error hover:bg-admin-error-light disabled:opacity-50 disabled:cursor-not-allowed"><Trash2 size={15} /></button></ComingSoonTooltip>
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
            <section className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div><h2 className="font-display text-2xl font-semibold">Orders</h2><p className="mt-1 text-sm text-brand-textMuted">Update statuses for COD, Khalti, eSewa and card orders.</p></div>
                <div className="flex flex-wrap gap-2"><ComingSoonTooltip><button disabled className="btn-press rounded-full border border-brand-border px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">Today</button></ComingSoonTooltip><ComingSoonTooltip><button disabled className="btn-press rounded-full border border-brand-border px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">This week</button></ComingSoonTooltip><ComingSoonTooltip><button disabled className="btn-press rounded-full bg-brand-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed">Create manual order</button></ComingSoonTooltip></div>
              </div>
              <div className="mt-4 overflow-x-auto -mx-6 px-6">
                <table className="w-full min-w-[900px] text-sm">
                  <caption className="sr-only">Order management</caption>
                  <thead><tr className="font-label border-y border-brand-border bg-brand-bgLight text-left text-xs uppercase tracking-[0.14em] text-brand-textMuted"><th scope="col" className="px-4 py-3">Order</th><th scope="col" className="px-4 py-3">Date</th><th scope="col" className="px-4 py-3">Items</th><th scope="col" className="px-4 py-3">Payment</th><th scope="col" className="px-4 py-3">Address</th><th scope="col" className="px-4 py-3">Total</th><th scope="col" className="px-4 py-3">Status</th></tr></thead>
                  <tbody>{orderRows.map((order) => (
                    <tr key={order.id} className="border-b border-brand-border/70 last:border-0">
<td className="px-4 py-4 font-mono text-xs font-semibold">{order.orderNumber}</td><td className="px-4 py-4">{order.date}</td><td className="px-4 py-4">{order.items.length}</td><td className="px-4 py-4">{order.paymentMethod}</td><td className="px-4 py-4 max-w-[200px] truncate">{order.shippingAddress}</td><td className="px-4 py-4 font-semibold">{formatNPR(order.total)}</td>
                       <td className="px-4 py-4"><select aria-label="Order status" value={order.status} onChange={(event) => setOrderStatusById((current) => ({ ...current, [order.id]: event.target.value as Order["status"] }))} className="rounded-full border border-brand-border bg-white px-3 py-2 text-xs font-medium outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"><option>Pending</option><option>Confirmed</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option></select></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === "inventory" ? (
            <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
              <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
                <h2 className="font-display text-2xl font-semibold">Stock control</h2>
                <p className="mt-0.5 text-sm text-brand-textMuted">Monitor stock, reorder points and estimated cover.</p>
                <div className="mt-4 grid gap-3 grid-cols-2 md:grid-cols-3"><StatCard icon={Boxes} label="Total units" value={INVENTORY_SUMMARY.totalUnits} note="Available catalog units" /><StatCard icon={AlertTriangle} label="Low stock" value={INVENTORY_SUMMARY.lowStockCount} note="Needs reorder review" /><StatCard icon={Store} label="Inventory value" value={formatNPR(inventoryValue)} note="Current retail value" /></div>
                <div className="mt-5 space-y-2">
                  {LOW_STOCK_SNAPSHOT.map((item) => <div key={item.productId} className="flex flex-col gap-2 rounded-xl border border-brand-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{item.name}</p><p className="text-xs text-brand-textMuted">{item.sku} · Reorder {item.reorderPoint} · Target {item.restockTarget}</p></div><div className="flex items-center gap-2"><StatusPill className={riskStyles[item.risk]}>{item.risk}</StatusPill><ComingSoonTooltip><button disabled className="btn-press rounded-full bg-brand-primary px-4 py-2 text-xs font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed">Restock</button></ComingSoonTooltip></div></div>)}
                </div>
              </div>
              <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm"><h3 className="font-display text-xl font-semibold">Inventory rules</h3><div className="mt-4 space-y-4 text-sm text-brand-textMuted"><p className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-admin-success" size={16} /> Best sellers should trigger reorder at 30 units.</p><p className="flex gap-3"><CheckCircle2 className="mt-0.5 shrink-0 text-admin-success" size={16} /> Show customer-safe availability labels only.</p><p className="flex gap-3"><AlertTriangle className="mt-0.5 shrink-0 text-admin-warning" size={16} /> Connect inventory ledger before accepting real orders.</p></div></div>
            </section>
          ) : null}

          {activeSection === "banners" ? (
            <section className="grid gap-6 lg:grid-cols-[1fr_0.76fr]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-2xl font-semibold">Banner manager</h2><p className="mt-0.5 text-sm text-brand-textMuted">Replace homepage and campaign banners with adaptive desktop and mobile assets.</p></div><button onClick={() => setBannerMessage("Banner settings saved in this browser. Connect the admin API to publish across devices.")} className="btn-press inline-flex items-center gap-2 rounded-full bg-brand-primary px-4 py-3 text-sm font-medium text-white"><Save size={15} /> Save banner</button></div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">{banners.map((banner) => <button key={banner.id} onClick={() => setSelectedBannerId(banner.id)} className={cn("rounded-xl border p-3 text-left transition", selectedBanner.id === banner.id ? "border-brand-primary bg-brand-primary-light" : "border-brand-border bg-white hover:bg-brand-bgLight")}><p className="font-semibold">{banner.title}</p><p className="mt-0.5 text-[11px] text-brand-textMuted">{banner.status} · Updated {banner.updatedAt}</p></button>)}</div>
                </div>
                <BannerPreview banner={selectedBanner} />
                <div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm">
                  <h3 className="font-display text-xl font-semibold">Edit selected banner</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
<label htmlFor="banner-title" className="space-y-2 text-sm font-medium">Title<input id="banner-title" value={selectedBanner.title} onChange={(event) => updateBannerField("title", event.target.value)} className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" /></label>
                     <label htmlFor="banner-cta" className="space-y-2 text-sm font-medium">CTA text<input id="banner-cta" value={selectedBanner.cta} onChange={(event) => updateBannerField("cta", event.target.value)} className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" /></label>
                     <label htmlFor="banner-subtitle" className="space-y-2 text-sm font-medium sm:col-span-2">Subtitle<textarea id="banner-subtitle" value={selectedBanner.subtitle} onChange={(event) => updateBannerField("subtitle", event.target.value)} className="mt-1 min-h-[80px] w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" /></label>
                     <label htmlFor="banner-link" className="space-y-2 text-sm font-medium">Link<input id="banner-link" value={selectedBanner.href} onChange={(event) => updateBannerField("href", event.target.value)} className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10" /></label>
                     <label htmlFor="banner-status" className="space-y-2 text-sm font-medium">Status<select id="banner-status" value={selectedBanner.status} onChange={(event) => updateBannerField("status", event.target.value as ManagedBanner["status"])} className="w-full rounded-xl border border-brand-border px-4 py-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10"><option>Published</option><option>Scheduled</option><option>Paused</option></select></label>
                  </div>
                </div>
              </div>
              <aside className="space-y-6">
                <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm"><Upload className="text-brand-primary" size={20} /><h3 className="mt-2 font-display text-xl font-semibold">Upload assets</h3><p className="mt-2 text-sm leading-6 text-brand-textMuted">Desktop: 16:7 ratio (1920 x 840). Mobile: 4:5 ratio (1080 x 1350). PNG, JPG, WebP, SVG under 3 MB.</p><div className="mt-4 space-y-3"><label className="block rounded-xl border border-dashed border-brand-primary/40 bg-brand-primary-light p-4 text-sm font-medium text-brand-primary cursor-pointer"><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleBannerUpload(event, "desktop")} className="hidden" />Upload desktop banner</label><label className="block rounded-xl border border-dashed border-brand-primary/40 bg-brand-primary-light p-4 text-sm font-medium text-brand-primary cursor-pointer"><input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => handleBannerUpload(event, "mobile")} className="hidden" />Upload mobile banner</label></div><div aria-live="polite">{uploadError ? <p className="mt-4 rounded-xl bg-admin-error-light p-3 text-sm font-medium text-admin-error">{uploadError}</p> : null}{bannerMessage ? <p className="mt-4 rounded-xl bg-admin-success-light p-3 text-sm font-medium text-admin-success">{bannerMessage}</p> : null}</div></div>
                <div className="rounded-2xl border border-brand-border bg-white p-6 shadow-sm"><Smartphone className="text-brand-primary" size={20} /><h3 className="mt-2 font-display text-xl font-semibold">Responsive rules</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-brand-textMuted"><li>Keep text inside the center safe area.</li><li>Use separate desktop and mobile crops.</li><li>Avoid tiny text inside image files.</li><li>Test at mobile, tablet and desktop widths before publishing.</li></ul></div>
              </aside>
            </section>
          ) : null}

          {activeSection === "customers" ? (
            <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm"><h2 className="font-display text-2xl font-semibold">Customers</h2><p className="mt-0.5 text-sm text-brand-textMuted">Customer records will connect to the live user and order APIs. The panel is ready for saved addresses, order value and contact preferences.</p><div className="mt-5 grid gap-3 grid-cols-2 md:grid-cols-3"><StatCard icon={Users} label="Total customers" value="26" note="Seeded admin count" /><StatCard icon={Mail} label="Newsletter leads" value="14" note="Waiting for email provider" /><StatCard icon={MapPin} label="Kathmandu area" value="18" note="Primary delivery cluster" /></div></section>
          ) : null}

          {activeSection === "analytics" ? (
            <section className="grid gap-5 lg:grid-cols-[1fr_0.75fr]"><div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm"><h2 className="font-display text-2xl font-semibold">Analytics</h2><p className="mt-0.5 text-sm text-brand-textMuted">Operational view of categories and product attention.</p><div className="mt-5 space-y-4">{Object.entries(categoryCounts).map(([category, count]) => <MiniBar key={category} label={category} value={count} max={maxCategoryCount} />)}</div></div><div className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm"><h3 className="font-display text-xl font-semibold">Top viewed products</h3><div className="mt-4 space-y-3">{topProducts.map((product) => <MiniBar key={product.id} label={product.name} value={product.reviewsCount} max={topProducts[0]?.reviewsCount || 1} />)}</div></div></section>
          ) : null}

          {activeSection === "settings" ? (
            <section className="rounded-2xl border border-brand-border bg-white p-5 shadow-sm"><h2 className="font-display text-2xl font-semibold">Store settings</h2><p className="mt-0.5 text-sm text-brand-textMuted">Business constants for GLAMO NEPAL.</p><div className="mt-5 grid gap-3 grid-cols-2"><SettingItem icon={Store} label="Store" value={SITE_CONFIG.fullTitle} /><SettingItem icon={MapPin} label="Address" value={SITE_CONFIG.address} /><SettingItem icon={Smartphone} label="Phone" value={SITE_CONFIG.phone} /><SettingItem icon={CreditCard} label="Payments" value={SITE_CONFIG.paymentMethods.join(", ")} /><SettingItem icon={Truck} label="Free shipping" value={`रू ${FREE_DELIVERY_THRESHOLD.toLocaleString()}`} /><SettingItem icon={ShieldCheck} label="Instagram" value={`${SITE_CONFIG.instagramHandle} · ${SITE_CONFIG.social.instagram}`} /></div></section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function SettingItem({ icon: Icon, label, value }: { icon: ComponentType<{ size?: number | string; className?: string }>; label: string; value: string }) {
  return <div className="rounded-xl border border-brand-border bg-brand-bgLight p-4"><div className="flex items-start gap-3"><Icon className="mt-0.5 text-brand-primary" size={16} /><div><p className="font-label text-xs font-bold uppercase tracking-[0.14em] text-brand-textMuted">{label}</p><p className="mt-1 text-sm font-medium text-brand-textPrimary">{value}</p></div></div></div>;
}

function SparklesIcon() {
  return <span className="font-display text-xl font-bold">G</span>;
}
