import Link from "next/link";
import { Heart, Package, Search, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  cart: { icon: ShoppingBag, title: "Your bag is empty", description: "Start with a cleanser, SPF, lip tint or a complete GLAMO routine.", cta: { label: "Start shopping", href: "/shop" } },
  wishlist: { icon: Heart, title: "No saved items yet", description: "Tap the heart on products you love and build your beauty shortlist.", cta: { label: "Browse products", href: "/shop" } },
  search: { icon: Search, title: "No results found", description: "Try different keywords or explore trending beauty edits.", cta: { label: "View all products", href: "/shop" } },
  orders: { icon: Package, title: "No orders yet", description: "Your order timeline will appear here after checkout.", cta: { label: "Start shopping", href: "/shop" } },
} as const;

type Variant = keyof typeof variants;

export function EmptyState({ variant, className, query }: { variant: Variant; className?: string; query?: string }) {
  const config = variants[variant];
  const Icon = config.icon;
  return (
    <div className={cn("flex flex-col items-center justify-center bg-white/75 px-6 py-16 text-center", className)}>
      <div className="relative flex h-28 w-28 items-center justify-center border border-neutral-200 bg-neutral-50">
        <span className="absolute left-5 top-4 h-3 w-3 rounded-full bg-secondary/70" />
        <span className="absolute bottom-5 right-5 h-4 w-4 rounded-full bg-primary/80" />
        <Icon size={42} className="text-primary" strokeWidth={1.35} />
      </div>
      <p className="type-label mt-8 text-xs font-bold uppercase tracking-widest text-primary">GLAMO Nepal</p>
      <h3 className="mt-2 font-display text-3xl font-semibold leading-tight text-neutral-900 md:text-4xl">
        {variant === "search" && query ? `No results for "${query}"` : config.title}
      </h3>
      <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-500">{config.description}</p>
      <Link href={config.cta.href} className="mt-7 inline-flex cursor-pointer bg-primary px-8 py-3 text-[13px] font-medium uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark">
        {config.cta.label}
      </Link>
    </div>
  );
}