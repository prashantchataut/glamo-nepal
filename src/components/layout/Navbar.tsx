
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, User, Heart, X, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useUIStore } from "@/store/useUIStore";

const NAV_LINKS = [
  { name: "Skincare", href: "/category/skincare" },
  { name: "Makeup", href: "/category/makeup" },
  { name: "Hair", href: "/category/haircare" },
  { name: "Brands", href: "/brands" },
  { name: "Journal", href: "/blog" },
];

const SECONDARY_LINKS = [
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
  { name: "Shipping", href: "/shipping-policy" },
  { name: "Returns", href: "/return-policy" },
  { name: "Admin", href: "/admin" },
];

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { getTotalItems: getCartTotal } = useCartStore();
  const { getTotalItems: getWishlistTotal } = useWishlistStore();
  const { openCart, openSearchModal } = useUIStore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    setMounted(true);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => setMobileMenuOpen(false), [pathname]);

  useEffect(() => {
    document.body.classList.toggle("scroll-locked", mobileMenuOpen);
    return () => document.body.classList.remove("scroll-locked");
  }, [mobileMenuOpen]);

  const cartCount = mounted ? getCartTotal() : 0;
  const wishlistCount = mounted ? getWishlistTotal() : 0;

  const CountBubble = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold leading-none text-white">
        {count}
      </span>
    ) : null;

  return (
    <>
      <header className={cn("sticky top-0 z-navbar border-b transition-all duration-300", isScrolled ? "border-neutral-200 bg-white/95 shadow-nav" : "border-[#ead9ed] bg-[#f5e5f6]")}> 
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="grid h-[58px] grid-cols-[auto_1fr_auto] items-center gap-3 lg:grid-cols-[1fr_auto_1fr]">
            <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link key={link.name} href={link.href} className={cn("text-[11px] font-semibold uppercase tracking-[0.13em] transition-colors", active ? "text-neutral-950" : "text-neutral-700 hover:text-primary")}>{link.name}</Link>
                );
              })}
            </nav>
            <button className="flex h-11 w-11 items-center justify-center rounded-full text-neutral-900 lg:hidden" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu"><Menu size={21} /></button>
            <Link href="/" className="justify-self-center font-display text-[28px] font-semibold leading-none tracking-[-0.035em] text-neutral-950 lg:text-[31px]" aria-label="GLAMO Nepal home">Glamo</Link>
            <div className="flex items-center justify-end gap-1.5">
              <button onClick={openSearchModal} className="hidden h-10 min-w-[320px] items-center justify-between rounded-full bg-white px-4 text-left text-[12px] text-neutral-500 shadow-[0_8px_28px_-22px_rgba(0,0,0,0.3)] ring-1 ring-neutral-200 transition hover:ring-primary/35 xl:flex" aria-label="Search GLAMO products">
                <span className="flex items-center gap-2"><Search size={15} /> What are you looking for?</span><span className="text-neutral-400">⌘K</span>
              </button>
              <button onClick={openSearchModal} className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 hover:bg-white/70 hover:text-primary xl:hidden" aria-label="Search"><Search size={18} /></button>
              <Link href="/wishlist" className="relative hidden h-10 w-10 items-center justify-center rounded-full text-neutral-700 hover:bg-white/70 hover:text-primary sm:flex" aria-label="Wishlist"><Heart size={18} /><CountBubble count={wishlistCount} /></Link>
              <Link href="/account" className="hidden h-10 w-10 items-center justify-center rounded-full text-neutral-700 hover:bg-white/70 hover:text-primary md:flex" aria-label="Account"><User size={18} /></Link>
              <button onClick={openCart} className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-700 hover:bg-white/70 hover:text-primary" aria-label={`Shopping cart${mounted ? `, ${cartCount} items` : ""}`}><ShoppingBag size={19} /><CountBubble count={cartCount} /></button>
            </div>
          </div>
        </div>
      </header>
      <div className={cn("fixed inset-0 z-menu-backdrop bg-neutral-950/35 transition-opacity duration-300 lg:hidden", mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label="Navigation menu" className={cn("fixed inset-y-0 left-0 z-menu w-[90vw] max-w-sm overflow-y-auto rounded-r-[34px] bg-[#fffaf7] shadow-2xl transition-transform duration-300 ease-out lg:hidden", mobileMenuOpen ? "translate-x-0" : "-translate-x-full")}> 
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-5"><Link href="/" className="font-display text-3xl font-semibold tracking-[-0.04em]">Glamo</Link><button className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><X size={21} /></button></div>
        <div className="px-5 py-5"><button onClick={() => { setMobileMenuOpen(false); openSearchModal(); }} className="flex min-h-12 w-full items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 text-left text-sm text-neutral-500"><Search size={18} />Search skincare, makeup, brands</button></div>
        <nav className="px-5" aria-label="Mobile navigation">{[{ name: "Shop all", href: "/shop" }, ...NAV_LINKS].map((link) => (<Link key={link.name} href={link.href} className={cn("flex min-h-14 items-center justify-between border-b border-neutral-200 text-sm font-semibold uppercase tracking-[0.14em]", pathname === link.href || pathname.startsWith(`${link.href}/`) ? "text-primary" : "text-neutral-800")}>{link.name}<ChevronRight size={16} /></Link>))}</nav>
        <div className="px-5 py-6"><Link href="/shop" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-xs font-semibold uppercase tracking-[0.16em] text-white"><Sparkles size={14} /> Shop the beauty edit</Link></div>
        <div className="border-t border-neutral-200 px-5 py-4">{SECONDARY_LINKS.map((link) => (<Link key={link.name} href={link.href} className="block py-2.5 text-sm text-neutral-600 hover:text-primary">{link.name}</Link>))}</div>
      </aside>
    </>
  );
}
