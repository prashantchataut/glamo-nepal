"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Leaf, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { CATEGORIES } from "@/lib/data/products";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useUIStore } from "@/store/useUIStore";

const desktopLinks = [
  { name: "Shop", href: "/shop" },
  { name: "New Arrivals", href: "/collections/new-arrivals" },
  { name: "Collections", href: "/collections" },
  { name: "Routines", href: "/routines" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className="relative z-10 inline-flex items-center gap-3 rounded-full px-1 py-1 outline-none transition focus-visible:ring-2 focus-visible:ring-brand-primary/30"
      aria-label="GLAMO Nepal home"
      prefetch={false}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary-light text-brand-primary shadow-sm ring-1 ring-brand-primary/10">
        <Leaf className="h-5 w-5" strokeWidth={1.6} />
      </span>
      <span className="leading-none">
        <span className="block font-serif text-3xl font-semibold tracking-[0.08em] text-brand-textPrimary">GLAMO</span>
        <span className="block text-[10px] uppercase tracking-[0.34em] text-brand-textMuted">Nepal</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { getTotalItems: getCartTotal } = useCartStore();
  const { getTotalItems: getWishlistTotal } = useWishlistStore();
  const { openCart, openSearchModal } = useUIStore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 6);
    handleScroll();
    setMounted(true);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setMobileMenuOpen(false), [pathname]);

  useEffect(() => {
    const onPulse = () => {
      setCartPulse(true);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      pulseTimer.current = setTimeout(() => setCartPulse(false), 650);
    };
    window.addEventListener("glamo:cart-pulse", onPulse);
    return () => {
      window.removeEventListener("glamo:cart-pulse", onPulse);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("scroll-locked", mobileMenuOpen);
    return () => document.body.classList.remove("scroll-locked");
  }, [mobileMenuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-navbar border-b border-brand-border/75 shadow-sm transition-all duration-300",
        isScrolled ? "bg-white/92 backdrop-blur-2xl" : "bg-white/86 backdrop-blur-xl",
      )}
    >
      <div className="container mx-auto grid h-[74px] grid-cols-[auto_1fr_auto] items-center gap-2 px-4 md:h-[78px] md:grid-cols-[1fr_auto_1fr] md:gap-6 md:px-6">
        <div className="flex min-w-0 items-center justify-start">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-textPrimary transition hover:bg-brand-primary-light hover:text-brand-primary md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>
          <nav className="hidden min-w-0 items-center gap-6 lg:gap-8 md:flex" aria-label="Primary navigation">
            {desktopLinks.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "relative whitespace-nowrap text-base font-semibold text-brand-textPrimary transition hover:text-brand-primary",
                    active && "text-brand-primary",
                  )}
                >
                  {link.name}
                  {active ? <span className="absolute -bottom-2 left-0 h-0.5 w-full rounded-full bg-brand-primary" /> : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex justify-center md:justify-self-center">
          <Logo />
        </div>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-1 md:gap-2">
          <button onClick={openSearchModal} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-textPrimary transition hover:bg-brand-primary-light hover:text-brand-primary" aria-label="Search">
            <Search size={19} />
          </button>
          <Link href="/account/wishlist" className="relative hidden h-11 w-11 items-center justify-center rounded-full text-brand-textPrimary transition hover:bg-brand-primary-light hover:text-brand-primary md:inline-flex" aria-label="Wishlist">
            <Heart size={19} />
            {mounted && getWishlistTotal() > 0 ? <span aria-live="polite" className={cn("absolute right-0 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[9px] font-bold text-white transition-transform", cartPulse && "scale-125")}>{getWishlistTotal()}</span> : null}
          </Link>
          <Link href="/account" className="hidden h-11 w-11 items-center justify-center rounded-full text-brand-textPrimary transition hover:bg-brand-primary-light hover:text-brand-primary md:inline-flex" aria-label="Account">
            <User size={19} />
          </Link>
          <button onClick={openCart} className={cn("relative inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-textPrimary transition hover:bg-brand-primary-light hover:text-brand-primary", cartPulse && "animate-bounce text-brand-primary")} aria-label={`Shopping cart, ${mounted ? getCartTotal() : 0} items`}>
            <ShoppingBag size={19} />
            {mounted && getCartTotal() > 0 ? <span aria-live="polite" className={cn("absolute right-0 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[9px] font-bold text-white transition-transform", cartPulse && "scale-125")}>{getCartTotal()}</span> : null}
          </button>
        </div>
      </div>

      <div className={cn("fixed inset-0 z-menu-backdrop bg-brand-bgDark/35 backdrop-blur-sm transition-opacity duration-300 md:hidden", mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => setMobileMenuOpen(false)} />
      <aside role="dialog" aria-modal="true" aria-label="Navigation menu" className={cn("fixed inset-y-0 left-0 z-menu w-[90%] max-w-sm overflow-y-auto bg-brand-surfaceCream p-6 shadow-2xl transition-transform duration-300 ease-out md:hidden", mobileMenuOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between">
          <Logo onClick={() => setMobileMenuOpen(false)} />
          <button className="inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-textPrimary transition hover:bg-brand-primary-light hover:text-brand-primary" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="mt-8 space-y-1" aria-label="Mobile navigation">
          {desktopLinks.map((link) => (
            <Link key={link.name} href={link.href} className="block rounded-2xl px-4 py-3 text-base font-semibold text-brand-textPrimary transition hover:bg-brand-primary-light hover:text-brand-primary">
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="mt-8 rounded-[1.75rem] border border-brand-border bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-primary">Popular categories</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {CATEGORIES.map((category) => (
              <Link key={category.slug} href={`/shop?category=${category.slug}`} className="rounded-2xl bg-brand-bgLight px-3 py-3 text-sm font-semibold text-brand-textPrimary transition hover:bg-brand-primary hover:text-white">
                {category.name}
              </Link>
            ))}
          </div>
        </div>
        <Link href="/login" className="mt-6 block rounded-full bg-brand-primary px-5 py-3 text-center text-sm font-bold text-white shadow-lg shadow-brand-primary/15 transition hover:bg-brand-primary-hover">
          Login / Register
        </Link>
      </aside>
    </header>
  );
}
