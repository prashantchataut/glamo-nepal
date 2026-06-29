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
  const cartItems = useCartStore((state) => state.items);
  const wishlistItems = useWishlistStore((state) => state.items);
  const openSearchModal = useUIStore((state) => state.openSearchModal);
  const user = useAuthStore((state) => state.user);
  const authLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 6);
    setMounted(true);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMobileMenuOpen(false), [pathname]);

  useEffect(() => {
    document.body.classList.toggle("scroll-locked", mobileMenuOpen);
    return () => document.body.classList.remove("scroll-locked");
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
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


  const cartCount = mounted ? cartItems.reduce((total, item) => total + item.quantity, 0) : 0;
  const wishlistCount = mounted ? wishlistItems.length : 0;
  const authReady = mounted && !authLoading;
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Account";

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    toast.success("Signed out of GLAMO.");
    router.push("/");
    router.refresh();
  };

  const CountBubble = ({ count, label }: { count: number; label: string }) =>
    count > 0 ? (
      <span aria-live="polite" aria-label={label} className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-950 px-1 text-[10px] font-semibold leading-none text-white">
        {count}
      </span>
    ) : null;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-navbar transition-all duration-300",
          isHome
            ? cn(
                "border-b border-secondary/60 bg-neutral-50/90 backdrop-blur-xl",
                isScrolled && "bg-neutral-50/95 shadow-navbar",
              )
            : cn(
                "border-b",
                isScrolled ? "border-neutral-300 bg-neutral-50/98 shadow-nav" : "border-secondary bg-brand-bgLight",
              ),
        )}
      >
        <div className={cn("mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8", isHome && "py-2.5 lg:py-3")}>
          <div
            className={cn(
              "grid min-h-[56px] grid-cols-[auto_1fr_auto] items-center gap-2 lg:grid-cols-[1fr_auto_1fr]",
              isHome && "rounded-full border border-white/80 bg-white/80 px-2.5 shadow-navbar-home ring-1 ring-primary/10 backdrop-blur-xl lg:min-h-[62px] lg:px-4",
            )}
          >
            <nav className="hidden items-center gap-6 xl:gap-8 lg:flex" aria-label="Primary navigation">
              {PRIMARY_LINKS.map((link) => {
                const active = isActivePath(pathname, link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      "font-body relative text-[12px] font-medium uppercase tracking-[0.18em] transition-colors after:absolute after:h-px after:bg-primary after:transition-all after:duration-300 hover:text-primary",
                      isHome
                        ? cn(
                            "rounded-full px-3 py-2 tracking-[0.16em] after:bottom-1 after:left-3",
                            active ? "bg-primary/10 text-neutral-950 after:w-[calc(100%-1.5rem)]" : "text-neutral-700 after:w-0 hover:bg-neutral-50 hover:after:w-[calc(100%-1.5rem)]",
                          )
                        : cn(
                            "after:-bottom-1.5 after:left-0",
                            active ? "text-neutral-950 after:w-full" : "text-neutral-700 after:w-0 hover:after:w-full",
                          ),
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <button
              ref={menuButtonRef}
              type="button"
              className={cn(
                "flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-950 transition hover:bg-white/70 lg:hidden z-10",
                isHome && "bg-white/75 ring-1 ring-primary/15 hover:bg-neutral-50",
              )}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={21} strokeWidth={1.6} />
            </button>

            <Link
              href="/"
              className={cn(
                "font-display justify-self-center text-[26px] font-semibold uppercase leading-none tracking-[0.32em] text-neutral-950 transition-colors hover:text-primary sm:text-[28px]",
                isHome && "text-neutral-950 drop-shadow-text-home",
              )}
              aria-label="GLAMO Nepal home"
            >
              <span className="pl-[0.32em]">GLAMO</span>
            </Link>

            <div className="flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={openSearchModal}
className={cn(
                   "flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-700 transition hover:bg-white/75 hover:text-primary",
                   isHome && "border border-secondary/30 bg-white/80 px-3 shadow-navbar-menu lg:min-w-[9.5rem] lg:justify-start lg:gap-2.5",
                 )}
                aria-label="Search products"
              >
                <Search size={18} strokeWidth={1.7} />
                {isHome ? (
                  <span className="hidden font-body text-sm font-semibold text-neutral-700 lg:inline">
                    Find your glow
                  </span>
                ) : null}
              </button>
              <Link
                href="/wishlist"
className={cn(
                   "relative hidden min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-700 transition hover:bg-white/75 hover:text-primary sm:flex",
                   isHome && "border border-secondary/30 bg-white/80 shadow-navbar-menu",
                 )}
                aria-label="Wishlist"
              >
                <Heart size={18} strokeWidth={1.7} />
                <CountBubble count={wishlistCount} label="Wishlist items" />
              </Link>
              {!authReady ? (
                <span className="hidden h-10 w-10 md:block" aria-hidden="true" />
              ) : user ? (
                <Link
                  href="/account"
                  className={cn(
                    "group hidden min-h-11 items-center gap-2.5 rounded-full transition md:flex",
                    isHome
                      ? "border border-secondary/30 bg-white/80 px-2 py-1.5 shadow-navbar-menu hover:bg-white/90"
                      : "px-2 py-1.5 hover:bg-white/75"
                  )}
                  aria-label={`Account, signed in as ${firstName}`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-rose-400 font-body text-xs font-bold uppercase tracking-wider text-neutral-50 shadow-sm transition-transform group-hover:scale-105">
                    {initialsOf(user.name, user.email || user.phone)}
                  </span>
                  <span className="font-body hidden max-w-[7rem] truncate text-[12px] font-semibold tracking-[0.02em] text-neutral-800 lg:inline">
                    {firstName}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className={cn(
                    "group hidden min-h-11 items-center gap-2 rounded-full px-3 py-1.5 font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-neutral-700 transition md:flex",
                    isHome
                      ? "border border-secondary/30 bg-white/80 shadow-navbar-menu hover:bg-white/90 hover:text-primary"
                      : "hover:bg-white/75 hover:text-primary"
                  )}
                  aria-label="Sign in"
                >
                  <User size={17} strokeWidth={1.8} className="transition-transform group-hover:scale-105" />
                  <span className="hidden lg:inline">Sign in</span>
                </Link>
              )}
              <Link
                href="/cart"
                className={cn(
                  "relative flex min-h-11 min-w-11 items-center justify-center rounded-full text-neutral-700 transition hover:bg-white/75 hover:text-primary",
                  isHome && "border border-secondary/30 bg-white/80 shadow-navbar-menu",
                )}
                aria-label={`Shopping cart${mounted ? `, ${cartCount} items` : ""}`}
              >
                <ShoppingBag size={19} strokeWidth={1.7} />
                <CountBubble count={cartCount} label="Cart items" />
                <span className="sr-only" aria-live="polite" aria-atomic="true">
                  {cartCount} {cartCount === 1 ? "item" : "items"} in cart
                </span>
              </Link>
            </div>
          </div>

          <div className={cn("pb-3 lg:pb-4", isHome && "hidden")}>
            <button
              type="button"
              onClick={openSearchModal}
              className="mx-auto flex min-h-11 w-full max-w-[980px] items-center justify-between rounded-full bg-white px-4 text-left text-[13px] text-neutral-600 shadow-search ring-1 ring-white/80 transition hover:ring-primary/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              aria-label="Search skincare, makeup, brands"
            >
<span className="flex min-w-0 items-center gap-2">
                 <Search size={15} strokeWidth={1.7} />
                 <span className="truncate text-neutral-600">Search skincare, makeup, SPF, brands...</span>
               </span>
              <span className="hidden text-sm font-semibold text-neutral-500 sm:block">
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
          "fixed inset-y-0 left-0 z-menu flex w-[92vw] max-w-sm flex-col overflow-y-auto rounded-r-[30px] bg-neutral-50 shadow-2xl transition-transform duration-300 ease-out lg:hidden",
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
                  "flex min-h-14 items-center justify-between border-b font-body text-sm font-medium uppercase tracking-[0.08em] transition-colors",
                  active
                    ? "border-primary/20 bg-primary/5 text-primary"
                    : "border-neutral-200 text-neutral-800 hover:text-primary",
                )}
              >
                <span className="flex items-center gap-2.5">
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />}
                  {link.name}
                </span>
                <ChevronRight size={16} strokeWidth={1.7} className={active ? "text-primary" : "text-neutral-400"} />
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-6">
          <p className="mb-3 text-sm font-semibold text-neutral-500">
            Shop by category
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORY_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                    active
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-neutral-200 bg-white text-neutral-800 hover:border-primary/40 hover:text-primary",
                  )}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-auto border-t border-neutral-200 px-5 py-5">
          {!authReady ? null : user ? (
            <div className="mb-4">
              <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-neutral-200">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-body text-sm font-semibold uppercase text-neutral-50">
                  {initialsOf(user.name, user.email || user.phone)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-neutral-900">{user.name?.trim() || "Your GLAMO account"}</p>
                  <p className="truncate text-xs text-neutral-500">{user.email || user.phone || "GLAMO customer"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/account" className="rounded-2xl bg-primary px-3 py-3 text-center text-xs font-semibold text-neutral-50 transition hover:bg-primary-dark">
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
                <Link key={link.name} href={link.href} className="rounded-2xl bg-primary px-3 py-3 text-center text-xs font-semibold text-neutral-50 transition hover:bg-primary-dark">
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
            {SUPPORT_LINKS.map((link) => {
              const active = isActivePath(pathname, link.href);
              return (
                <Link key={link.name} href={link.href} className={cn("py-1.5 text-sm transition-colors", active ? "text-primary font-medium" : "text-neutral-700 hover:text-primary")}>
                  {link.name}
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
