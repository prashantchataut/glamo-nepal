"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, LockKeyhole, MapPin, Package } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { ordersApi } from "@/lib/api/orders";
import { formatNPR } from "@/lib/utils";

interface RecentOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  status: string;
  itemCount: number;
  image?: string;
  source: "session" | "api";
}

function initials(name?: string, phone?: string) {
  const source = name?.trim() || phone || "Glamo customer";
  return source.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function AccountDashboardClient() {
  const user = useAuthStore((state) => state.user);
  const wishlistCount = useWishlistStore((state) => state.getTotalItems);
  const sessionOrders = useCheckoutStore((state) => state.orders);
  const [apiOrders, setApiOrders] = useState<RecentOrder[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    ordersApi
      .list()
      .then((response) => {
        if (cancelled) return;
        const list = Array.isArray(response.data) ? response.data : [];
        setApiOrders(
          list.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            date: order.createdAt.slice(0, 10),
            total: order.grandTotal,
            status: order.orderStatus,
            itemCount: (order.items || []).length,
            source: "api" as const,
          })),
        );
      })
      .catch(() => {
        if (!cancelled) setApiOrders([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const recentOrders = useMemo(() => {
    const session: RecentOrder[] = sessionOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.date,
      total: order.total,
      status: order.status,
      itemCount: order.items.length,
      image: order.items[0]?.image,
      source: "session" as const,
    }));
    const merged = [...apiOrders, ...session].filter(
      (order, index, list) => list.findIndex((item) => item.orderNumber === order.orderNumber) === index,
    );
    return merged.sort((a, b) => b.date.localeCompare(a.date));
  }, [apiOrders, sessionOrders]);

  const orderCount = recentOrders.length;
  const savedCount = mounted ? wishlistCount() : 0;

  const quickLinks = [
    {
      name: "Orders",
      href: "/account/orders",
      icon: Package,
      description: orderCount > 0 ? `${orderCount} order${orderCount === 1 ? "" : "s"} placed` : "No orders yet",
    },
    {
      name: "Wishlist",
      href: "/account/wishlist",
      icon: Heart,
      description: savedCount > 0 ? `${savedCount} saved` : "Save products you love",
    },
    { name: "Addresses", href: "/account/addresses", icon: MapPin, description: "Manage delivery addresses" },
    { name: "Password", href: "/account/password", icon: LockKeyhole, description: "Update your password" },
  ];

  const displayName = user?.name?.trim() || "Your GLAMO account";
  const contactInfo = user?.email || user?.phone || "Sign in to sync your profile.";
  const accountBadge = user?.email ? "Email account" : user?.phone ? "Mobile account" : null;

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-neutral-200/80 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 font-display text-xl font-semibold text-primary ring-1 ring-primary/10">
            {initials(user?.name, user?.phone)}
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-brand-textPrimary md:text-3xl">
              {user?.name ? `Hello, ${user.name.split(" ")[0]}` : displayName}
            </h1>
            <p className="mt-0.5 truncate text-sm text-brand-textMuted">{contactInfo}</p>
            {accountBadge && (
              <span className="mt-2 inline-flex rounded-full bg-brand-bgLight px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-primary ring-1 ring-brand-border/60">
                {accountBadge}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-[1.5rem] border border-neutral-200/80 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-card-hover"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white">
                <Icon size={18} strokeWidth={1.7} />
              </div>
              <h2 className="mt-3 font-display text-[15px] font-semibold text-brand-textPrimary">{link.name}</h2>
              <p className="mt-1 text-[13px] leading-snug text-brand-textMuted">{link.description}</p>
            </Link>
          );
        })}
      </div>

      {recentOrders.length > 0 && (
        <section>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-xl font-semibold text-brand-textPrimary">Recent orders</h2>
            <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary-hover">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {recentOrders.slice(0, 3).map((order) => {
              const card = (
                <article className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-neutral-200/80 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover md:p-5">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-brand-bgLight">
                      {order.image ? (
                        <Image src={order.image} alt={order.orderNumber} fill className="object-cover" sizes="48px" />
                      ) : (
                        <Package className="m-3 text-brand-primary" size={20} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-display text-[15px] font-semibold text-brand-textPrimary">{order.orderNumber}</p>
                      <p className="mt-0.5 text-[13px] text-brand-textMuted">
                        {order.date} &middot; {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-brand-textPrimary">{formatNPR(order.total)}</p>
                </article>
              );
              return order.source === "api" ? (
                <Link key={order.orderNumber} href={`/account/orders/${order.id}`}>
                  {card}
                </Link>
              ) : (
                <div key={order.orderNumber}>{card}</div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}