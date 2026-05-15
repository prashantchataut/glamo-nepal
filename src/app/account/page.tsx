import { createMetadata } from "@/lib/seo";
import { Package, Heart, MapPin, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { SAMPLE_USER } from "@/lib/data/users";

export const metadata = createMetadata({
  title: "My Account",
  description: "Manage your GLAMO NEPAL account, orders, wishlist and settings.",
  path: "/account",
  noIndex: true,
});

const quickLinks = [
  { name: "Orders", href: "/account/orders", icon: Package, description: "Track and review your orders" },
  { name: "Wishlist", href: "/account/wishlist", icon: Heart, description: "Saved products you love" },
  { name: "Addresses", href: "/account/addresses", icon: MapPin, description: "Manage delivery addresses" },
  { name: "Password", href: "/account/password", icon: LockKeyhole, description: "Update your password" },
];

export default function AccountDashboardPage() {
  const user = SAMPLE_USER;

  return (
    <div>
      <div className="rounded-[2rem] border border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_48%,#F7F1EA_100%)] p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white font-display text-2xl font-semibold text-brand-primary ring-1 ring-brand-border">
            {user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
          </div>
          <div>
            <h1 className="font-display text-3xl font-semibold text-brand-textPrimary md:text-4xl">
              Hello, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-brand-textMuted">{user.email}</p>
          </div>
        </div>
        <p className="mt-4 font-label inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-primary ring-1 ring-brand-border">
          {user.loyaltyPoints.toLocaleString()} glow points
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