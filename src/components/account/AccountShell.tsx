"use client";
// Client component required: uses browser-only interactivity, hooks, stores, or Next.js error-boundary reset.

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LayoutDashboard, LockKeyhole, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { toast } from "sonner";
import { SAMPLE_USER as SAMPLE_USER } from "@/lib/data/users";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import { clearAuthCookies } from "@/lib/auth-cookies";

const navLinks = [
  { name: "Dashboard", href: "/account", icon: LayoutDashboard },
  { name: "Profile", href: "/account/profile", icon: UserRound },
  { name: "Orders", href: "/account/orders", icon: Package },
  { name: "Wishlist", href: "/account/wishlist", icon: Heart },
  { name: "Addresses", href: "/account/addresses", icon: MapPin },
  { name: "Password", href: "/account/password", icon: LockKeyhole },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const clearCart = useCartStore((state) => state.clearCart);
  const resetCheckout = useCheckoutStore((state) => state.reset);
  const sessionUser = useAuthStore((state) => state.user);
  const user = sessionUser ?? SAMPLE_USER;

  const handleLogout = () => {
    clearAuthCookies();
    logout();
    clearCart();
    resetCheckout();
    toast.success("Logged out of GLAMO account.");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-brand-bgLight">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <nav className="lg:hidden flex overflow-x-auto gap-1 pb-4 no-scrollbar" aria-label="Account navigation">
          {navLinks.map(({ name, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/account" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={cn("flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition", active ? "bg-brand-primary text-white" : "bg-white text-brand-textMuted hover:text-brand-primary")}>
                <Icon size={16} strokeWidth={1.7} />
                {name}
              </Link>
            );
          })}
        </nav>
        <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
          <aside className="hidden lg:block lg:sticky lg:top-[calc(var(--total-header-height)+24px)] lg:self-start">
            <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-white shadow-sm">
              <div className="bg-[linear-gradient(135deg,#FFFDFC_0%,#F8EEF2_60%,#F7F1EA_100%)] p-6 text-brand-textPrimary">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white font-display text-xl font-semibold text-brand-primary ring-1 ring-brand-border">
                    {user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-brand-textMuted">{user.email}</p>
                  </div>
                </div>
                <p className="font-label mt-4 rounded-full bg-white px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-brand-primary ring-1 ring-brand-border">
                  {"loyaltyPoints" in user ? user.loyaltyPoints.toLocaleString() : "0"} glow points
                </p>
              </div>
              <nav className="grid gap-1 p-3" aria-label="Account navigation">
                {navLinks.map(({ name, href, icon: Icon }) => {
                  const active = pathname === href || (href !== "/account" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-primary/30",
                        active ? "bg-brand-primary text-white shadow-sm" : "text-brand-textMuted hover:bg-brand-bgLight hover:text-brand-primary",
                      )}
                    >
                      <Icon size={18} strokeWidth={1.7} />
                      {name}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                >
                  <LogOut size={18} strokeWidth={1.7} />
                  Logout
                </button>
              </nav>
            </div>
          </aside>
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}