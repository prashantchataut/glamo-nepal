"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, ShoppingBag, User, Menu, X, ChevronDown, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useUIStore } from "@/store/useUIStore";
import { NAV_CATEGORIES } from "@/lib/constants";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const { getTotalItems: getCartTotal } = useCartStore();
  const { getTotalItems: getWishlistTotal } = useWishlistStore();
  const { openCart, openSearchModal } = useUIStore();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    setMounted(true);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-500",
        isScrolled
          ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_0_0_rgba(0,0,0,0.05)] py-3"
          : "bg-white/60 backdrop-blur-md py-4 md:py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          <button
            className="md:hidden p-2 -ml-2 text-brand-textPrimary"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link href="/" className={cn("hover:text-brand-primary transition-colors duration-300", pathname === "/" && "text-brand-primary")}>
              Home
            </Link>
            <div
              className="relative"
              onMouseEnter={() => setShopMenuOpen(true)}
              onMouseLeave={() => setShopMenuOpen(false)}
            >
              <button className={cn("flex items-center gap-1 hover:text-brand-primary transition-colors duration-300 py-2", pathname.startsWith("/shop") && "text-brand-primary")}>
                Shop <ChevronDown size={14} className={cn("transition-transform duration-300", shopMenuOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {shopMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 w-[640px] bg-white shadow-2xl rounded-2xl border border-border/30 overflow-hidden flex z-50"
                  >
                    <div className="w-1/2 p-8 bg-brand-bgLight/50">
                      <h3 className="font-serif text-xl font-semibold mb-5 text-brand-primary">Categories</h3>
                      <ul className="space-y-3">
                        {NAV_CATEGORIES.map((cat) => (
                          <li key={cat.name}>
                            <Link href={cat.href} className="text-brand-textMuted hover:text-brand-primary transition-colors duration-200 block group flex items-center justify-between">
                              <span>{cat.name}</span>
                              <span className="text-xs text-brand-textMuted/50 group-hover:text-brand-primary transition-colors">{cat.description}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 flex flex-wrap gap-3">
                        <Link href="/shop" className="text-sm font-semibold border-b-2 border-brand-primary text-brand-primary pb-1 hover:text-brand-bgDark hover:border-brand-bgDark transition-colors">
                          View All Products
                        </Link>
                        <Link href="/collections" className="text-sm font-semibold border-b-2 border-brand-secondary text-brand-primary pb-1 hover:text-brand-bgDark hover:border-brand-bgDark transition-colors">
                          Collections
                        </Link>
                        <Link href="/routines" className="text-sm font-semibold border-b-2 border-brand-secondary text-brand-primary pb-1 hover:text-brand-bgDark hover:border-brand-bgDark transition-colors">
                          Routines
                        </Link>
                      </div>
                    </div>
                    <div className="w-1/2 p-8 bg-brand-bgDark text-white relative overflow-hidden">
                      <div className="relative z-10">
                        <span className="inline-block px-3 py-1 bg-brand-primary/30 text-[10px] font-bold rounded-full mb-4 uppercase tracking-[0.15em]">Bestseller</span>
                        <h4 className="font-serif text-2xl mb-2">Himalayan Vitamin C Glow Serum</h4>
                        <p className="text-sm text-white/70 mb-5 line-clamp-2">A Nepal-market mock bestseller with original GLAMO copy.</p>
                        <Link href="/product/himalayan-vitamin-c-glow-serum" className="inline-block bg-white text-brand-bgDark px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-secondary hover:text-white transition-colors duration-300">
                          Shop Now
                        </Link>
                      </div>
                      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-brand-primary/40 rounded-full blur-[60px]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link href="/about" className={cn("hover:text-brand-primary transition-colors duration-300", pathname === "/about" && "text-brand-primary")}>Our Story</Link>
            <Link href="/blog" className={cn("hover:text-brand-primary transition-colors duration-300", pathname === "/blog" && "text-brand-primary")}>Blog</Link>
            <Link href="/collections" className={cn("hover:text-brand-primary transition-colors duration-300", pathname.startsWith("/collections") && "text-brand-primary")}>Collections</Link>
            <Link href="/routines" className={cn("hover:text-brand-primary transition-colors duration-300", pathname.startsWith("/routines") && "text-brand-primary")}>Routines</Link>
            <Link href="/brands" className={cn("hover:text-brand-primary transition-colors duration-300", pathname.startsWith("/brands") && "text-brand-primary")}>Brands</Link>
            <Link href="/contact" className={cn("hover:text-brand-primary transition-colors duration-300", pathname === "/contact" && "text-brand-primary")}>Contact</Link>
          </nav>

          <Link href="/" className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-1.5">
              <Leaf className="text-brand-primary w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
              <span className="font-serif text-2xl md:text-3xl font-semibold tracking-[0.08em] text-brand-textPrimary">GLAMO</span>
            </div>
            <span className="text-[8px] md:text-[9px] tracking-[0.35em] font-medium text-brand-textMuted uppercase -mt-0.5 ml-7">Nepal</span>
          </Link>

          <div className="flex items-center gap-3 md:gap-5">
            <button onClick={openSearchModal} className="text-brand-textPrimary hover:text-brand-primary transition-colors duration-300 hidden md:block" aria-label="Search">
              <Search size={20} strokeWidth={1.5} />
            </button>
            <Link href="/account/wishlist" className="text-brand-textPrimary hover:text-brand-primary transition-colors duration-300 hidden md:block relative">
              <Heart size={20} strokeWidth={1.5} />
              {mounted && getWishlistTotal() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-secondary text-white text-[9px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold">{getWishlistTotal()}</span>
              )}
            </Link>
            <Link href="/account" className="text-brand-textPrimary hover:text-brand-primary transition-colors duration-300 hidden md:block">
              <User size={20} strokeWidth={1.5} />
            </Link>
            <button onClick={openCart} className="text-brand-textPrimary hover:text-brand-primary transition-colors duration-300 relative" aria-label="Cart">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {mounted && getCartTotal() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-primary text-white text-[9px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold">{getCartTotal()}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-[85vw] max-w-[400px] bg-white shadow-2xl z-50 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-border/30">
                <Link href="/" className="flex flex-col items-start" onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center gap-1.5">
                    <Leaf className="text-brand-primary w-5 h-5" strokeWidth={1.5} />
                    <span className="font-serif text-xl font-semibold tracking-[0.08em]">GLAMO</span>
                  </div>
                  <span className="text-[7px] tracking-[0.35em] font-medium text-brand-textMuted uppercase -mt-0.5 ml-7">Nepal</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-brand-textMuted hover:text-brand-textPrimary hover:bg-brand-bgLight rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 px-5">
                <nav className="flex flex-col gap-5">
                  <Link href="/" className="text-lg font-medium hover:text-brand-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                  <div className="border-t border-border/30 pt-5">
                    <span className="text-xs font-bold text-brand-textMuted uppercase tracking-[0.15em] mb-4 block">Shop</span>
                    <ul className="space-y-3">
                      {NAV_CATEGORIES.map(cat => (
                        <li key={cat.name}>
                          <Link href={cat.href} className="text-base hover:text-brand-primary transition-colors block" onClick={() => setMobileMenuOpen(false)}>{cat.name}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="border-t border-border/30 pt-5 flex flex-col gap-4">
                    <Link href="/about" className="text-lg font-medium hover:text-brand-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Our Story</Link>
                    <Link href="/blog" className="text-lg font-medium hover:text-brand-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
                    <Link href="/collections" className="text-lg font-medium hover:text-brand-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Collections</Link>
                    <Link href="/routines" className="text-lg font-medium hover:text-brand-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Routines</Link>
                    <Link href="/brands" className="text-lg font-medium hover:text-brand-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Brands</Link>
                    <Link href="/contact" className="text-lg font-medium hover:text-brand-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
                  </div>
                </nav>
              </div>

              <div className="p-5 border-t border-border/30 bg-brand-bgLight/50">
                <div className="flex items-center gap-4 mb-4">
                  <Link href="/account" className="flex items-center gap-2 text-sm font-medium hover:text-brand-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    <User size={18} strokeWidth={1.5} /> My Account
                  </Link>
                  <Link href="/account/wishlist" className="flex items-center gap-2 text-sm font-medium hover:text-brand-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    <Heart size={18} strokeWidth={1.5} /> Wishlist
                  </Link>
                </div>
                <Link href="/login" className="w-full block text-center bg-brand-primary text-white py-3.5 rounded-full font-medium hover:bg-brand-bgDark transition-colors duration-300" onClick={() => setMobileMenuOpen(false)}>
                  Login / Register
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}