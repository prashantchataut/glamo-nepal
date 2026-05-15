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
  const config = variants[variant]; const Icon = config.icon;
  return <div className={cn("flex flex-col items-center justify-center rounded-3xl bg-white/75 px-6 py-16 text-center", className)}>
    <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[linear-gradient(135deg,#FFFDFC,#F8EEF8)] shadow-sm ring-1 ring-brand-border"><span className="absolute left-5 top-4 h-3 w-3 rounded-full bg-brand-gold/70" /><span className="absolute bottom-5 right-5 h-4 w-4 rounded-full bg-brand-secondary/80" /><Icon size={42} className="text-brand-primary" strokeWidth={1.35} /></div>
    <p className="font-label mt-8 text-xs font-bold uppercase tracking-widest text-brand-primary">GLAMO Nepal</p>
    <h3 className="mt-2 font-display text-3xl font-semibold leading-tight text-brand-textPrimary md:text-4xl">{variant === "search" && query ? `No results for “${query}”` : config.title}</h3>
    <p className="mt-3 max-w-sm text-sm leading-6 text-brand-textMuted">{config.description}</p>
    <Link href={config.cta.href} className="mt-7 inline-flex rounded-full bg-brand-primary px-8 py-3 text-sm font-bold text-white shadow-md shadow-brand-primary/15 transition hover:-translate-y-0.5 hover:bg-brand-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 active:scale-[0.98]">{config.cta.label}</Link>
  </div>;
}
