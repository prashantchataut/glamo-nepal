"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useUIStore } from "@/store/useUIStore";

const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Search, label: "Search", href: "#", action: "search" as const },
  { icon: ShoppingBag, label: "Cart", href: "#", action: "cart" as const },
  { icon: Heart, label: "Wishlist", href: "/account/wishlist" },
  { icon: User, label: "Account", href: "/account" },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { getTotalItems: getCartTotal } = useCartStore();
  const { getTotalItems: getWishlistTotal } = useWishlistStore();
  const { openCart, openSearchModal } = useUIStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAction = (action: string) => {
    if (action === "search") {
      openSearchModal();
    } else if (action === "cart") {
      openCart();
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-border/50 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = item.href !== "#" && pathname === item.href;
          const Icon = item.icon;
          const count =
            mounted && item.action === "cart"
              ? getCartTotal()
              : mounted && item.label === "Wishlist"
              ? getWishlistTotal()
              : 0;

          return item.action ? (
            <button
              key={item.label}
              onClick={() => handleAction(item.action)}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] text-brand-textMuted hover:text-brand-primary transition-colors relative"
              aria-label={item.label}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {count > 0 && (
                <span className="absolute -top-0.5 right-0 bg-brand-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {count}
                </span>
              )}
            </button>
          ) : (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] transition-colors relative",
                isActive
                  ? "text-brand-primary"
                  : "text-brand-textMuted hover:text-brand-primary"
              )}
              aria-label={item.label}
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {count > 0 && (
                <span className="absolute -top-0.5 right-0 bg-brand-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
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