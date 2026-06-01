"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Link from "next/link";
import NextImage from "next/image";
import {
  Users,
  Package,
  ShoppingBag,
  AlertTriangle,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react";
import { PRODUCTS } from "@/lib/data/products";
import {
  INVENTORY_SUMMARY,
  LOW_STOCK_SNAPSHOT,
} from "@/lib/data/inventory";
import { SAMPLE_ORDER_HISTORY, type Order } from "@/lib/data/orders";
import { formatNPR } from "@/lib/utils";
import { StatusPill } from "@/components/admin/shared/StatusPill";
import { orderStatusToVariant, stockStatusToVariant } from "@/components/admin/shared/StatusPill";

const adminImageHost = "https://images." + "unsplash.com";
const adminImage = (path: string) => `${adminImageHost}${path}`;

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

const defaultBanners: ManagedBanner[] = [
  {
    id: "hero-new-year",
    title: "New Year 2083 Beauty Edit",
    subtitle: "Fresh skincare, soft glam makeup and giftable beauty picks curated for Nepal.",
    cta: "Shop New Year Offers",
    href: "/collections/festival-ready",
    desktopImage: adminImage("/photo-1596462502278-27bfdc403348?w=1600&q=85&fit=crop"),
    mobileImage: adminImage("/photo-1487412947147-5cebf100ffc2?w=900&q=85&fit=crop"),
    status: "Published",
    updatedAt: "2026-05-01",
  },
  {
    id: "store-visit",
    title: "Visit GLAMO NEPAL in Naya Baneshwor",
    subtitle: "Find us at Mantra In & Out Square, Kathmandu.",
    cta: "Get Directions",
    href: "/contact",
    desktopImage: adminImage("/photo-1556228578-8c89e6adf883?w=1600&q=85&fit=crop"),
    mobileImage: adminImage("/photo-1522337360788-8b13dee7a37e?w=900&q=85&fit=crop"),
    status: "Published",
    updatedAt: "2026-05-01",
  },
];

const bannerStorageKey = "glamo-admin-managed-banners";

function StatCard({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
}) {
  return (
    <div className="card-hover rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-4">
        <div className="rounded-xl bg-brand-primary-light p-3 text-brand-primary">
          <Icon size={18} />
        </div>
        <span className="font-label rounded-full bg-brand-bgLight px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-brand-textMuted">
          Live
        </span>
      </div>
      <p className="mt-4 text-xs font-medium text-brand-textMuted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-textPrimary">
        {value}
      </p>
      <p className="mt-2 text-xs leading-4 text-brand-textMuted">{note}</p>
    </div>
  );
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
        <div
          className="h-1.5 rounded-full bg-brand-primary"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function BannerPreview({ banner }: { banner: ManagedBanner }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-brand-bgDark text-white shadow-lg">
      <div className="grid min-h-[180px] md:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-center p-5 md:p-6">
          <span className="font-label w-fit rounded-full bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/75">
            {banner.status}
          </span>
          <h3 className="mt-3 font-display text-2xl font-semibold leading-tight md:text-3xl">
            {banner.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/70">{banner.subtitle}</p>
          <Link
            href={banner.href}
            className="mt-4 w-fit rounded-full bg-white px-4 py-2 text-sm font-bold text-brand-primary"
          >
            {banner.cta}
          </Link>
        </div>
        <div className="relative min-h-[180px] bg-white/10">
          <NextImage
            src={banner.desktopImage}
            alt="Banner preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 40vw"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}

export function DashboardView() {
  const [banners, setBanners] = useState<ManagedBanner[]>(defaultBanners);
  const [selectedBannerId] = useState(defaultBanners[0].id);
  const [orderStatusById] = useState<Record<string, Order["status"]>>({});

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

  const selectedBanner =
    banners.find((banner) => banner.id === selectedBannerId) || banners[0];
  const grossSales = useMemo(
    () => SAMPLE_ORDER_HISTORY.reduce((sum, order) => sum + order.total, 0),
    []
  );
  const lowStockCount = INVENTORY_SUMMARY.lowStockCount;
  const orderRows = SAMPLE_ORDER_HISTORY.map((order) => ({
    ...order,
    status: orderStatusById[order.id] || order.status,
  }));
  const categoryCounts = useMemo(
    () =>
      PRODUCTS.reduce<Record<string, number>>((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {}),
    []
  );
  const maxCategoryCount = Math.max(...Object.values(categoryCounts));

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] bg-brand-bgDark text-white shadow-lg">
        <div className="grid gap-6 p-5 md:p-6 xl:grid-cols-[1fr_0.78fr] xl:items-center">
          <div>
            <span className="font-label inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">
              <ShieldCheck size={14} /> Protected workspace
            </span>
            <h2 className="mt-4 font-display text-2xl font-semibold leading-tight md:text-4xl">
              Welcome to GLAMO NEPAL admin.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
              Manage catalog quality, order flow, inventory risks and homepage
              banners from one operating panel.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/admin?section=products"
                className="btn-press rounded-full bg-white px-4 py-3 text-sm font-bold text-brand-primary"
              >
                Manage products
              </Link>
              <Link
                href="/admin?section=banners"
                className="btn-press rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white"
              >
                Replace banners
              </Link>
            </div>
          </div>
          <BannerPreview banner={selectedBanner} />
        </div>
      </section>

      <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard
          icon={Users}
          label="Customers"
          value="26"
          note="Seeded customer view until API connected"
        />
        <StatCard
          icon={Package}
          label="Products"
          value={PRODUCTS.length}
          note={`${PRODUCTS.filter((product) => product.madeInNepal).length} Made in Nepal picks`}
        />
        <StatCard
          icon={ShoppingBag}
          label="Orders"
          value={SAMPLE_ORDER_HISTORY.length}
          note={`${formatNPR(grossSales)} sample order value`}
        />
        <StatCard
          icon={AlertTriangle}
          label="Stock watch"
          value={lowStockCount}
          note={`${INVENTORY_SUMMARY.totalUnits} total units`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-display text-xl font-semibold">
                Order history
              </h3>
              <p className="mt-1 text-sm text-brand-textMuted">
                Track payment, status and fulfillment.
              </p>
            </div>
            <Link
              href="/admin?section=orders"
              className="btn-press rounded-full border border-brand-border px-4 py-2 text-sm font-bold text-brand-primary min-h-[44px]"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[700px] text-sm">
              <caption className="sr-only">Recent orders</caption>
              <thead>
                <tr className="font-label border-y border-brand-border bg-brand-bgLight text-left text-xs uppercase tracking-[0.14em] text-brand-textMuted">
                  <th scope="col" className="px-4 py-3">
                    Order
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Customer
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Payment
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Total
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderRows.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-brand-border/70 last:border-0"
                  >
                    <td className="px-4 py-4 font-mono text-xs font-semibold text-brand-textPrimary">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-4">
                      {order.shippingAddress.split(",")[0]}
                    </td>
                    <td className="px-4 py-4">{order.paymentMethod}</td>
                    <td className="px-4 py-4 font-bold">
                      {formatNPR(order.total)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill variant={orderStatusToVariant(order.status)}>
                        {order.status}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        aria-label="Open order actions"
                        className="flex h-11 w-11 items-center justify-center rounded-full text-brand-textMuted hover:bg-brand-bgLight"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-hover rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold">
              Top categories
            </h3>
            <div className="mt-4 space-y-4">
              {Object.entries(categoryCounts).map(([category, count]) => (
                <MiniBar
                  key={category}
                  label={category}
                  value={count}
                  max={maxCategoryCount}
                />
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
            <h3 className="font-display text-xl font-semibold">
              Low-stock alerts
            </h3>
            <div className="mt-4 space-y-3">
              {LOW_STOCK_SNAPSHOT.slice(0, 4).map((item) => (
                <div
                  key={item.productId}
                  className="flex items-center justify-between gap-3 rounded-xl bg-brand-bgLight p-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-brand-textPrimary">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-brand-textMuted">
                      Reorder at {item.reorderPoint}
                    </p>
                  </div>
                  <StatusPill variant={stockStatusToVariant(item.risk)}>
                    {item.stockCount}
                  </StatusPill>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}