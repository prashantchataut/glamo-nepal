import Link from "next/link";
import { ShoppingBag, Heart, Search, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  cart: {
    icon: ShoppingBag,
    title: "Your cart is empty",
    description: "Looks like you haven't added any products yet.",
    cta: { label: "Start shopping", href: "/shop" },
  },
  wishlist: {
    icon: Heart,
    title: "Your wishlist is empty",
    description: "Save products you love and find them here later.",
    cta: { label: "Browse products", href: "/shop" },
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search or browse our collections.",
    cta: { label: "View all products", href: "/shop" },
  },
  orders: {
    icon: Package,
    title: "No orders yet",
    description: "When you place your first order, it will appear here.",
    cta: { label: "Start shopping", href: "/shop" },
  },
} as const;

type Variant = keyof typeof variants;

export function EmptyState({ variant, className }: { variant: Variant; className?: string }) {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-primary-light">
        <Icon size={32} className="text-brand-primary" strokeWidth={1.5} />
      </div>
      <h3 className="mt-6 font-serif text-2xl font-semibold text-brand-textPrimary">{config.title}</h3>
      <p className="mt-2 max-w-sm text-sm text-brand-textMuted">{config.description}</p>
      <Link
        href={config.cta.href}
        className="btn-press mt-6 rounded-full bg-brand-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/15 transition hover:bg-brand-primary-hover"
      >
        {config.cta.label}
      </Link>
    </div>
  );
}