"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";

const navItems = [
  { icon: Home, label: "Home", href: "/", action: undefined as string | undefined },
  { icon: ShoppingBag, label: "Cart", href: "/cart", action: undefined as string | undefined },
  { icon: Search, label: "Search", href: "#", action: "search" as const },
  { icon: Heart, label: "Wishlist", href: "/account/wishlist", action: undefined as string | undefined },
  { icon: User, label: "Account", href: "/account", action: undefined as string | undefined },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { getTotalItems: getWishlistTotal } = useWishlistStore();
  const { getTotalItems: getCartTotal } = useCartStore();
  const { openSearchModal } = useUIStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-neutral-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_3px_rgba(0,0,0,0.05)] md:hidden" aria-label="Mobile navigation">
      <div className="flex h-full items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.href !== "#" && (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));
          const Icon = item.icon;
          const count = mounted
            ? item.label === "Wishlist"
              ? getWishlistTotal()
              : item.label === "Cart"
                ? getCartTotal()
                : 0
            : 0;

          if (item.action === "search") {
            return (
              <button key={item.label} type="button" onClick={openSearchModal} className={cn("relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 transition-colors", isActive ? "text-primary" : "text-neutral-400 hover:text-primary")} aria-label="Open search">
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[11px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link key={item.label} href={item.href} className={cn("relative flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 transition-colors", isActive ? "text-primary" : "text-neutral-400 hover:text-primary")} aria-label={item.label}>
              <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              <span className={cn("text-[11px] font-medium", isActive && "font-semibold")}>{item.label}</span>
              {count > 0 && (
                <span aria-live="polite" className="absolute -top-0.5 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}