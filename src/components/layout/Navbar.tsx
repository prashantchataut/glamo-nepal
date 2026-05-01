"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Leaf, Menu, Search, ShoppingBag, User, X } from "lucide-react";
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
    window.addEventListener("scroll", handleScroll);
    setMounted(true);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header
      style={{ "--navbar-height": "4.5rem" } as React.CSSProperties}
      className={cn(
        "sticky top-0 z-50 border-b border-black/5 transition-all duration-300 md:[--navbar-height:5rem]",
        isScrolled
          ? "bg-white/95 backdrop-blur-xl shadow-sm shadow-purple-100/50"
          : "bg-white/85 backdrop-blur-md"
      )}
    >
      <div className="container relative mx-auto flex h-[var(--navbar-height)] items-center px-4 md:px-6">
        {/* Left section */}
        <div className="flex shrink-0 items-center gap-1 md:gap-2">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-textPrimary transition hover:bg-[#FBF7F8] hover:text-brand-primary md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>
          <nav className="hidden items-center gap-7 md:flex">
            {desktopLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-sm font-medium text-brand-textPrimary transition hover:text-brand-primary",
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? "text-brand-primary"
                    : ""
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Center: absolutely centered logo */}
        <div className="absolute inset-x-0 flex justify-center pointer-events-none">
          <Link
            href="/"
            className="pointer-events-auto flex items-center gap-2"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FBF0F5] text-brand-primary">
              <Leaf className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <span>
              <span className="block font-serif text-2xl font-semibold tracking-[0.08em] text-brand-textPrimary">
                GLAMO
              </span>
              <span className="block text-[9px] uppercase tracking-[0.34em] text-brand-textMuted">
                Nepal
              </span>
            </span>
          </Link>
        </div>

        {/* Right section */}
        <div className="ml-auto flex shrink-0 items-center gap-1 md:gap-2">
          <button
            onClick={openSearchModal}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-textPrimary transition hover:bg-[#FBF7F8] hover:text-brand-primary"
            aria-label="Search"
          >
            <Search size={19} />
          </button>
          <Link
            href="/account/wishlist"
            className="relative hidden h-11 w-11 items-center justify-center rounded-full text-brand-textPrimary transition hover:bg-[#FBF7F8] hover:text-brand-primary md:inline-flex"
            aria-label="Wishlist"
          >
            <Heart size={19} />
            {mounted && getWishlistTotal() > 0 ? (
              <span className="absolute right-0 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[9px] font-bold text-white">
                {getWishlistTotal()}
              </span>
            ) : null}
          </Link>
          <Link
            href="/account"
            className="hidden h-11 w-11 items-center justify-center rounded-full text-brand-textPrimary transition hover:bg-[#FBF7F8] hover:text-brand-primary md:inline-flex"
            aria-label="Account"
          >
            <User size={19} />
          </Link>
          <button
            onClick={openCart}
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-textPrimary transition hover:bg-[#FBF7F8] hover:text-brand-primary"
            aria-label="Cart"
          >
            <ShoppingBag size={19} />
            {mounted && getCartTotal() > 0 ? (
              <span className="absolute right-0 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[9px] font-bold text-white">
                {getCartTotal()}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      {/* Mobile menu backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[65] bg-black/35 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          mobileMenuOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile menu panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] w-[88%] max-w-sm bg-white p-6 shadow-2xl transition-transform duration-300 ease-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FBF0F5] text-brand-primary">
              <Leaf className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <span>
              <span className="block font-serif text-2xl font-semibold tracking-[0.08em] text-brand-textPrimary">
                GLAMO
              </span>
              <span className="block text-[9px] uppercase tracking-[0.34em] text-brand-textMuted">
                Nepal
              </span>
            </span>
          </Link>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-brand-textPrimary transition hover:bg-[#FBF7F8] hover:text-brand-primary"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mt-8 space-y-1">
          {desktopLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block rounded-2xl px-4 py-3 text-base font-medium text-brand-textPrimary transition hover:bg-[#FBF7F8] hover:text-brand-primary"
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/login"
            className="mt-4 block rounded-full bg-brand-primary px-5 py-3 text-center text-sm font-semibold text-white"
          >
            Login / Register
          </Link>
        </nav>
      </aside>
    </header>
  );
}