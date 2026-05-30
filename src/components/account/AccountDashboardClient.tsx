"use client";

import Link from "next/link";
import { Heart, LockKeyhole, MapPin, Package } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

const quickLinks = [
  { name: "Orders", href: "/account/orders", icon: Package, description: "Track and review your orders" },
  { name: "Wishlist", href: "/account/wishlist", icon: Heart, description: "Saved products you love" },
  { name: "Addresses", href: "/account/addresses", icon: MapPin, description: "Manage delivery addresses" },
  { name: "Password", href: "/account/password", icon: LockKeyhole, description: "Update your password" },
];

function initials(name?: string, phone?: string) {
  const source = name?.trim() || phone || "Glamo customer";
  return source.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

export function AccountDashboardClient() {
  const user = useAuthStore((state) => state.user);
  const displayName = user?.name?.trim() || "Your GLAMO account";
  const contactInfo = user?.phone || "Sign in with your phone number to sync your profile, wishlist and orders.";

  return (
    <div>
      <div className="rounded-[2rem] border border-brand-border bg-brand-bgLight p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white font-display text-2xl font-semibold text-brand-primary ring-1 ring-brand-border">
            {initials(user?.name, user?.phone)}
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-brand-textPrimary md:text-4xl">
              {user?.name ? `Hello, ${user.name.split(" ")[0]}` : displayName}
            </h1>
            <p className="mt-1 text-sm text-brand-textMuted">{contactInfo}</p>
          </div>
        </div>
        <p className="font-label mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary ring-1 ring-brand-border">
          Phone-verified account
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-primary/30 hover:shadow-card-hover"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary-light text-brand-primary transition group-hover:bg-brand-primary group-hover:text-white">
                <Icon size={18} strokeWidth={1.7} />
              </div>
              <h2 className="mt-3 font-display text-lg font-semibold text-brand-textPrimary">{link.name}</h2>
              <p className="mt-1 text-sm text-brand-textMuted">{link.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
