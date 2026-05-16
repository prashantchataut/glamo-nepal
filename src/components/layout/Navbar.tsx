"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useUIStore } from "@/store/useUIStore";

const PRIMARY_LINKS = [
  { name: "Shop", href: "/shop" },
  { name: "Brands", href: "/brands" },
  { name: "New In", href: "/collections/new-arrivals" },
  { name: "About", href: "/about" },
];

const CATEGORY_LINKS = [
  { name: "Skincare", href: "/shop?category=skincare" },
  { name: "Makeup", href: "/shop?category=makeup" },
  { name: "Hair Care", href: "/shop?category=haircare" },
  { name: "Body & Bath", href: "/shop?category=bodycare" },
];

const SUPPORT_LINKS = [
  { name: "Shipping", href: "/shipping-policy" },
  { name: "Returns", href: "/return-policy" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact", href: "/contact" },
];

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  const cleanHref = href.split("?")[0];
  if (cleanHref === "/") return pathname === "/";
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cartTotal = useCartStore((state) => state.getTotalItems);
  const wishlistTotal = useWishlistStore((state) => state.getTotalItems);
  const openSearchModal = useUIStore((state) => state.openSearchModal);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 6);
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

  function openSearch(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    openSearchModal();
  }

  const cartCount = mounted ? cartTotal() : 0;
  const wishlistCount = mounted ? wishlistTotal() : 0;

  const CountBubble = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-none bg-brand-rose px-1 text-[9px] font-semibold leading-none text-white">
        {count}
      </span>
    ) : null;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-navbar border-b backdrop-blur-md transition-colors duration-300",
          isScrolled ? "border-cream-200 bg-cream-50/95 shadow-nav" : "border-transparent bg-cream-50/90",
        )}
      >
        <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
          <div className="grid min-h-[68px] grid-cols-[auto_1fr_auto] items-center gap-2 lg:grid-cols-[1fr_auto_1fr]">
            <nav className="hidden items-center gap-6 xl:gap-8 lg:flex" aria-label="Primary navigation">
              {PRIMARY_LINKS.map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      "relative text-[13px] font-semibold uppercase tracking-[0.12em] transition-colors after:absolute after:-bottom-2 after:left-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-brand-rose after:transition-transform hover:after:scale-x-100",
                      active ? "text-brand-rose after:scale-x-100" : "text-cream-700 hover:text-brand-rose",
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-none text-ink transition hover:bg-cream-100 lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation-drawer"
            >
              <Menu size={21} strokeWidth={1.6} />
            </button>

            <Link
              href="/"
              className="justify-self-center font-display text-[23px] font-light uppercase leading-none tracking-[0.2em] text-ink transition hover:text-brand-rose sm:text-[28px]"
              aria-label="GLAMO Nepal home"
            >
              GLAMO
            </Link>

            <div className="flex items-center justify-end gap-1.5">
              <Link
                href="/search"
                onClick={openSearch}
                className="hidden min-h-10 min-w-10 items-center justify-center rounded-none text-cream-700 transition hover:bg-cream-100 hover:text-brand-rose sm:flex"
                aria-label="Search products"
              >
                <Search size={18} strokeWidth={1.7} />
              </Link>
              <Link
                href="/wishlist"
                className="relative hidden min-h-10 min-w-10 items-center justify-center rounded-none text-cream-700 transition hover:bg-cream-100 hover:text-brand-rose sm:flex"
                aria-label="Wishlist"
              >
                <Heart size={18} strokeWidth={1.7} />
                <CountBubble count={wishlistCount} />
              </Link>
              <Link
                href="/login"
                className="hidden min-h-10 min-w-10 items-center justify-center rounded-none text-cream-700 transition hover:bg-cream-100 hover:text-brand-rose md:flex"
                aria-label="Customer login"
              >
                <User size={18} strokeWidth={1.7} />
              </Link>
              <a
                href="/cart"
                className="relative flex min-h-10 min-w-10 items-center justify-center rounded-none text-cream-700 transition hover:bg-cream-100 hover:text-brand-rose"
                aria-label={`Shopping cart${mounted ? `, ${cartCount} items` : ""}`}
              >
                <ShoppingBag size={19} strokeWidth={1.7} />
                <CountBubble count={cartCount} />
              </a>
            </div>
          </div>

          <div className="hidden">
            <Link
              href="/search"
              onClick={openSearch}
              className="mx-auto flex min-h-11 w-full max-w-[980px] items-center justify-between rounded-none bg-cream-50 px-4 text-left text-[13px] text-cream-400 shadow-[0_12px_30px_-26px_rgba(0,0,0,0.5)] ring-1 ring-white/80 transition hover:ring-primary/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose focus-visible:ring-offset-2"
              aria-label="Search skincare, makeup, brands"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Search size={15} strokeWidth={1.7} />
                <span className="truncate">Search skincare, makeup, SPF, brands...</span>
              </span>
              <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-cream-400 sm:block">
                Search
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-menu-backdrop bg-ink/35 transition-opacity duration-300 lg:hidden",
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        id="mobile-navigation-drawer"
        className={cn(
          "fixed inset-y-0 left-0 z-menu flex w-[min(85vw,320px)] flex-col overflow-y-auto bg-cream-50 shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <Link href="/" className="font-display text-2xl font-light uppercase tracking-[0.2em] text-ink">
            GLAMO
          </Link>
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-none bg-cream-50 text-ink ring-1 ring-neutral-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} strokeWidth={1.6} />
          </button>
        </div>

        <div className="px-5 py-5">
          <Link
            href="/search"
            onClick={(event) => {
              setMobileMenuOpen(false);
              openSearch(event);
            }}
            className="flex min-h-12 w-full items-center gap-3 rounded-none border border-cream-200 bg-cream-50 px-4 text-left text-sm text-cream-400"
          >
            <Search size={18} strokeWidth={1.7} />
            Search products and brands
          </Link>
        </div>

        <nav className="px-5" aria-label="Mobile primary navigation">
          {PRIMARY_LINKS.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex min-h-14 items-center justify-between border-b border-cream-200 text-sm font-semibold uppercase tracking-[0.14em]",
                  active ? "text-brand-rose" : "text-ink",
                )}
              >
                {link.name}
                <ChevronRight size={16} strokeWidth={1.7} />
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream-400">
            Shop by category
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="rounded-none border border-cream-200 bg-cream-50 px-4 py-3 text-sm font-semibold text-cream-800 transition hover:border-brand-rose/40 hover:text-brand-rose"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-cream-200 px-5 py-5">
          <div className="grid grid-cols-3 gap-2 pb-5">
            <Link href="/login" className="rounded-none bg-cream-50 px-3 py-3 text-center text-xs font-semibold text-cream-700 ring-1 ring-neutral-200">
              Login
            </Link>
            <Link href="/wishlist" className="rounded-none bg-cream-50 px-3 py-3 text-center text-xs font-semibold text-cream-700 ring-1 ring-neutral-200">
              Wishlist
            </Link>
            <a href="/cart" className="rounded-none bg-ink px-3 py-3 text-center text-xs font-semibold text-white">
              Cart
            </a>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {SUPPORT_LINKS.map((link) => (
              <Link key={link.name} href={link.href} className="py-1.5 text-sm text-cream-700 hover:text-brand-rose">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
