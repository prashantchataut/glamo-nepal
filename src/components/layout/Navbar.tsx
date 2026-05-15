"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, User, Heart, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useUIStore } from "@/store/useUIStore";

const NAV_LINKS = [
  { name: "Shop", href: "/shop" },
  { name: "New Arrivals", href: "/collections/new-arrivals" },
  { name: "Brands", href: "/brands" },
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
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    setMounted(true);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.classList.toggle("scroll-locked", mobileMenuOpen);
    return () => document.body.classList.remove("scroll-locked");
  }, [mobileMenuOpen]);

  const cartCount = mounted ? getCartTotal() : 0;
  const wishlistCount = mounted ? getWishlistTotal() : 0;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-navbar h-[72px] transition-all duration-300",
          isScrolled
            ? "bg-neutral-50/95 backdrop-blur-md border-b border-neutral-200 shadow-nav"
            : "bg-neutral-50 border-b border-transparent"
        )}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
          {/* Mobile: Hamburger */}
          <button
            className="flex h-10 w-10 items-center justify-center text-neutral-700 transition-colors hover:text-primary cursor-pointer lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={22} />
          </button>

          {/* Desktop: Nav links (left) */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => {
              const active =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "type-nav relative py-1 transition-colors duration-150",
                    active
                      ? "text-primary"
                      : "text-neutral-700 hover:text-primary"
                  )}
                >
                  {link.name}
                  {active && (
                    <span className="absolute -bottom-0.5 left-0 h-0.5 w-full bg-secondary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Center: Logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 lg:relative lg:left-auto lg:translate-x-0"
            aria-label="GLAMO Nepal home"
            prefetch={false}
          >
            <span className="font-display text-2xl font-light tracking-[0.15em] text-neutral-900">
              GLAMO
            </span>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={openSearchModal}
              className="flex h-10 w-10 items-center justify-center text-neutral-700 transition-colors hover:text-primary cursor-pointer"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            <Link
              href="/account/wishlist"
              className="relative hidden md:flex h-10 w-10 items-center justify-center text-neutral-700 transition-colors hover:text-primary cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-white">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/account"
              className="hidden md:flex h-10 w-10 items-center justify-center text-neutral-700 transition-colors hover:text-primary cursor-pointer"
              aria-label="Account"
            >
              <User size={20} />
            </Link>
            <button
              onClick={openCart}
              className="relative flex h-10 w-10 items-center justify-center text-neutral-700 transition-colors hover:text-primary cursor-pointer"
              aria-label={`Shopping cart${mounted ? `, ${cartCount} items` : ""}`}
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-menu-backdrop bg-neutral-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          mobileMenuOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed inset-y-0 left-0 z-menu w-[85vw] max-w-sm overflow-y-auto bg-surface shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-6">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="font-display text-2xl font-light tracking-[0.15em] text-neutral-900"
          >
            GLAMO
          </Link>
          <button
            className="flex h-10 w-10 items-center justify-center text-neutral-700 transition-colors hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Search in drawer */}
        <div className="px-6 pb-4">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              openSearchModal();
            }}
            className="flex w-full items-center gap-3 border-b border-neutral-200 py-3 text-neutral-400 transition-colors hover:text-primary"
          >
            <Search size={18} />
            <span className="type-body-sm">Search products...</span>
          </button>
        </div>

        {/* Nav links */}
        <nav className="px-6" aria-label="Mobile navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "block border-b border-neutral-100 py-4 type-nav transition-colors",
                pathname === link.href || pathname.startsWith(`${link.href}/`)
                  ? "text-primary"
                  : "text-neutral-700 hover:text-primary"
              )}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Account section */}
        <div className="mt-8 px-6">
          <Link
            href="/login"
            className="block w-full bg-primary py-3 text-center text-[13px] font-medium tracking-[0.1em] uppercase text-white transition-colors hover:bg-primary-dark"
          >
            Login / Register
          </Link>
        </div>

        {/* Bottom links */}
        <div className="mt-6 border-t border-neutral-200 px-6 pt-6">
          <Link
            href="/account/wishlist"
            className="flex items-center gap-3 py-3 text-neutral-700 transition-colors hover:text-primary"
          >
            <Heart size={18} />
            <span className="type-body-sm">Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}</span>
          </Link>
          <Link
            href="/account"
            className="flex items-center gap-3 py-3 text-neutral-700 transition-colors hover:text-primary"
          >
            <User size={18} />
            <span className="type-body-sm">My Account</span>
          </Link>
        </div>
      </aside>
    </>
  );
}