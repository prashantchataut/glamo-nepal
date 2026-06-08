"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LogOut, Menu, Search, ShoppingBag, User, X, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useUIStore } from "@/store/useUIStore";

const PRIMARY_LINKS = [
  { name: "Shop", href: "/shop" },
  { name: "Brands", href: "/brands" },
  { name: "Routines", href: "/routines" },
  { name: "New In", href: "/collections/new-arrivals" },
  { name: "About", href: "/about" },
];

const CATEGORY_LINKS = [
  { name: "Skincare", href: "/shop?category=skincare" },
  { name: "Makeup", href: "/shop?category=makeup" },
  { name: "Haircare", href: "/shop?category=haircare" },
  { name: "Bodycare", href: "/shop?category=bodycare" },
];

const SUPPORT_LINKS = [
  { name: "Shipping", href: "/shipping-policy" },
  { name: "Returns", href: "/return-policy" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact", href: "/contact" },
];

const AUTH_LINKS = [
  { name: "Sign in", href: "/login" },
  { name: "Create account", href: "/register" },
];

function isActivePath(pathname: string | null, href: string) {
  if (!pathname) return false;
  const cleanHref = href.split("?")[0];
  if (cleanHref === "/") return pathname === "/";
  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}

function initialsOf(name?: string, fallback?: string) {
  const source = name?.trim() || fallback?.trim() || "";
  if (!source) return "GL";
  return source
    .split(/\s+|@/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const cartTotal = useCartStore((state) => state.getTotalItems);
  const wishlistTotal = useWishlistStore((state) => state.getTotalItems);
  const openSearchModal = useUIStore((state) => state.openSearchModal);
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);

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

  useEffect(() => {
    if (!mobileMenuOpen || !menuRef.current) return;
    const menu = menuRef.current;
    const focusable = menu.querySelectorAll<HTMLElement>(
      'a[href], button, input, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();
    const handleTabTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    menu.addEventListener("keydown", handleTabTrap);
    return () => menu.removeEventListener("keydown", handleTabTrap);
  }, [mobileMenuOpen]);


  const cartCount = mounted ? cartTotal() : 0;
  const wishlistCount = mounted ? wishlistTotal() : 0;
  const authReady = mounted && !authLoading;
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Account";

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    toast.success("Signed out of GLAMO.");
    router.push("/");
    router.refresh();
  };

  const CountBubble = ({ count }: { count: number }) =>
    count > 0 ? (
      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-950 px-1 text-[9px] font-semibold leading-none text-white">
        {count}
      </span>
    ) : null;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-navbar border-b transition-colors duration-300",
          isScrolled ? "border-[#e9dfd8] bg-[#fffaf7]/98 shadow-nav" : "border-[#ead8e8] bg-[#f7e5f5]",
        )}
      >
        <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
          <div className="grid min-h-[56px] grid-cols-[auto_1fr_auto] items-center gap-2 lg:grid-cols-[1fr_auto_1fr]">
            <nav className="hidden items-center gap-6 xl:gap-8 lg:flex" aria-label="Primary navigation">
              {PRIMARY_LINKS.map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      "font-body relative text-[12px] font-medium uppercase tracking-[0.18em] transition-colors after:absolute after:-bottom-1.5 after:left-0 after:h-px after:bg-primary after:transition-all after:duration-300 hover:text-primary",
                      active ? "text-neutral-950 after:w-full" : "text-neutral-600 after:w-0 hover:after:w-full",
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-950 transition hover:bg-white/70 lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={21} strokeWidth={1.6} />
            </button>

            <Link
              href="/"
              className="font-display justify-self-center text-[26px] font-semibold uppercase leading-none tracking-[0.32em] text-neutral-950 transition-colors hover:text-primary sm:text-[28px]"
              aria-label="GLAMO Nepal home"
            >
              <span className="pl-[0.32em]">GLAMO</span>
            </Link>

<div className="flex items-center justify-end gap-1.5">
               <button
                 type="button"
                 onClick={openSearchModal}
                 className="flex min-h-10 min-w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-white/75 hover:text-primary"
                 aria-label="Search products"
               >
                 <Search size={18} strokeWidth={1.7} />
               </button>
               <Link
                 href="/wishlist"
                 className="relative hidden min-h-10 min-w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-white/75 hover:text-primary sm:flex"
                 aria-label="Wishlist"
               >
                 <Heart size={18} strokeWidth={1.7} />
                 <CountBubble count={wishlistCount} />
               </Link>
               {!authReady ? (
                 <span className="hidden h-10 w-10 md:block" aria-hidden="true" />
               ) : user ? (
                 <Link
                   href="/account"
                   className="hidden min-h-10 items-center gap-2 rounded-full pl-1 pr-2.5 text-neutral-700 transition hover:bg-white/75 md:flex"
                   aria-label={`Account, signed in as ${firstName}`}
                 >
                   <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-body text-[11px] font-semibold uppercase tracking-wide text-white">
                     {initialsOf(user.name, user.email || user.phone)}
                   </span>
                   <span className="font-body hidden max-w-[7rem] truncate text-[12px] font-medium tracking-[0.04em] lg:inline">
                     {firstName}
                   </span>
                 </Link>
               ) : (
                 <Link
                   href="/login"
                   className="font-body hidden min-h-10 items-center gap-2 rounded-full px-3 text-[12px] font-medium uppercase tracking-[0.14em] text-neutral-700 transition hover:bg-white/75 hover:text-primary md:flex"
                   aria-label="Sign in"
                 >
                   <User size={18} strokeWidth={1.7} />
                   <span className="hidden lg:inline">Sign in</span>
                 </Link>
               )}
               <Link
                 href="/cart"
                 className="relative flex min-h-10 min-w-10 items-center justify-center rounded-full text-neutral-700 transition hover:bg-white/75 hover:text-primary"
                 aria-label={`Shopping cart${mounted ? `, ${cartCount} items` : ""}`}
               >
                 <ShoppingBag size={19} strokeWidth={1.7} />
                 <CountBubble count={cartCount} />
               </Link>
             </div>
          </div>

          <div className="pb-3 lg:pb-4">
            <button
              type="button"
              onClick={openSearchModal}
              className="mx-auto flex min-h-11 w-full max-w-[980px] items-center justify-between rounded-full bg-white px-4 text-left text-[13px] text-neutral-500 shadow-[0_12px_30px_-26px_rgba(0,0,0,0.5)] ring-1 ring-white/80 transition hover:ring-primary/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Search skincare, makeup, brands"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Search size={15} strokeWidth={1.7} />
                <span className="truncate">Search skincare, makeup, SPF, brands...</span>
              </span>
              <span className="hidden text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400 sm:block">
                Search
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        className={cn(
          "fixed inset-0 z-menu-backdrop bg-neutral-950/35 transition-opacity duration-300 lg:hidden",
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed inset-y-0 left-0 z-menu flex w-[92vw] max-w-sm flex-col overflow-y-auto rounded-r-[30px] bg-[#fffaf7] shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <Link href="/" className="font-display text-2xl font-semibold uppercase tracking-[0.28em] text-neutral-950">
            <span className="pl-[0.28em]">GLAMO</span>
          </Link>
          <button
            type="button"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white text-neutral-900 ring-1 ring-neutral-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={21} strokeWidth={1.6} />
          </button>
        </div>

        <div className="px-5 py-5">
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              openSearchModal();
            }}
            className="flex min-h-12 w-full items-center gap-3 rounded-full border border-neutral-200 bg-white px-4 text-left text-sm text-neutral-500"
          >
            <Search size={18} strokeWidth={1.7} />
            Search products and brands
          </button>
        </div>

        <nav className="px-5" aria-label="Mobile primary navigation">
          {PRIMARY_LINKS.map((link) => {
            const active = isActivePath(pathname, link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex min-h-14 items-center justify-between border-b border-neutral-200 font-body text-sm font-medium uppercase tracking-[0.08em]",
                  active ? "text-primary" : "text-neutral-800",
                )}
              >
                {link.name}
                <ChevronRight size={16} strokeWidth={1.7} />
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Shop by category
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition hover:border-primary/40 hover:text-primary"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-auto border-t border-neutral-200 px-5 py-5">
          {!authReady ? null : user ? (
            <div className="mb-4">
              <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-neutral-200">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-body text-sm font-semibold uppercase text-white">
                  {initialsOf(user.name, user.email || user.phone)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{user.name?.trim() || "Your GLAMO account"}</p>
                  <p className="truncate text-xs text-neutral-500">{user.email || user.phone || "GLAMO customer"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/account" className="rounded-2xl bg-primary px-3 py-3 text-center text-xs font-semibold text-white transition hover:bg-primary-dark">
                  My account
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 rounded-2xl bg-white px-3 py-3 text-center text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200 transition hover:text-primary"
                >
                  <LogOut size={15} strokeWidth={1.8} />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 grid grid-cols-2 gap-2">
              {AUTH_LINKS.map((link) => (
                <Link key={link.name} href={link.href} className="rounded-2xl bg-primary px-3 py-3 text-center text-xs font-semibold text-white transition hover:bg-primary-dark">
                  {link.name}
                </Link>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pb-5">
            <Link href="/wishlist" className="rounded-2xl bg-white px-3 py-3 text-center text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200">
              Wishlist
            </Link>
            <Link href="/cart" className="rounded-2xl bg-neutral-950 px-3 py-3 text-center text-xs font-semibold text-white">
              Cart
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {SUPPORT_LINKS.map((link) => (
              <Link key={link.name} href={link.href} className="py-1.5 text-sm text-neutral-600 hover:text-primary">
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
