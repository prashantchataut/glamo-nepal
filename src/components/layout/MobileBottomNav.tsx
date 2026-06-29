"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, Search, ShoppingBag, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";

const navItems = [
  { icon: Home, label: "Home", href: "/", action: undefined as string | undefined },
  { icon: ShoppingBag, label: "Cart", href: "/cart", action: undefined as string | undefined },
  { icon: Search, label: "Search", href: "#", action: "search" as const },
  { icon: Heart, label: "Wishlist", href: "/wishlist", action: undefined as string | undefined },
  { icon: UserCircle, label: "Account", href: "/account", action: undefined as string | undefined },
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200/80 bg-white/[0.97] pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_12px_rgba(0,0,0,0.06)] backdrop-blur-lg md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
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
              <button
                key={item.label}
                type="button"
                onClick={openSearchModal}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-0.5 rounded-2xl px-4 py-2 transition-all duration-200",
                  isActive
                    ? "text-primary"
                    : "text-neutral-400 active:scale-95 active:bg-neutral-50"
                )}
                aria-label="Search products"
              >
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200",
                  isActive ? "bg-primary/10" : "group-hover:bg-neutral-100"
                )}>
                  <Icon size={19} strokeWidth={isActive ? 2.2 : 1.6} />
                </div>
                <span className={cn(
                  "text-xs font-semibold tracking-wide transition-colors",
                  isActive ? "text-primary" : "text-neutral-400 group-hover:text-neutral-600"
                )}>
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-0.5 rounded-2xl px-4 py-2 transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-neutral-400 active:scale-95 active:bg-neutral-50"
              )}
              aria-label={item.label}
            >
              <div className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200",
                isActive ? "bg-primary/10" : "group-hover:bg-neutral-100"
              )}>
                <Icon size={19} strokeWidth={isActive ? 2.2 : 1.6} />
              </div>
              <span className={cn(
                "text-xs font-semibold tracking-wide transition-colors",
                isActive ? "text-primary" : "text-neutral-400 group-hover:text-neutral-600"
              )}>
                {item.label}
              </span>
              {count > 0 && (
                <span
                  aria-live="polite"
                  className="absolute -right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-neutral-50 shadow-[0_1px_4px_rgba(219,39,119,0.3)]"
                >
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