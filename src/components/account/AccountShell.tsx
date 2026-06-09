"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LayoutDashboard, LockKeyhole, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useCheckoutStore } from "@/store/useCheckoutStore";

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
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logout = useAuthStore((state) => state.logout);
  const clearCart = useCartStore((state) => state.clearCart);
  const resetCheckout = useCheckoutStore((state) => state.reset);

  useEffect(() => {
    if (!isLoading && user === null) {
      router.replace("/login?redirect=/account");
    }
  }, [isLoading, user, router]);

  const handleLogout = async () => {
    await logout();
    clearCart();
    resetCheckout();
    toast.success("Logged out of GLAMO account.");
    router.push("/login");
    router.refresh();
  };

  if (isLoading || user === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bgLight">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading account" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bgLight pb-20 md:pb-0">
      <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <nav className="flex gap-1.5 overflow-x-auto pb-4 no-scrollbar lg:hidden" aria-label="Account navigation">
          {navLinks.map(({ name, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/account" && pathname.startsWith(href));
            return (
              <Link key={href} href={href} className={cn("flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-200", active ? "bg-neutral-950 text-white shadow-sm" : "bg-white text-brand-textMuted ring-1 ring-neutral-200/80 hover:text-brand-primary")}>
                <Icon size={16} strokeWidth={1.7} />
                {name}
              </Link>
            );
          })}
        </nav>
        <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
          <aside className="hidden lg:block lg:sticky lg:top-[calc(var(--total-header-height)+24px)] lg:self-start">
            <div className="overflow-hidden rounded-[1.75rem] border border-neutral-200/80 bg-white shadow-sm">
              <div className="bg-gradient-to-br from-brand-bgLight to-white p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 font-display text-lg font-semibold text-primary ring-1 ring-primary/10">
                    {(user?.name || user?.phone || "Glamo customer").split(/\s+|@/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold text-brand-textPrimary">{user?.name || "Your GLAMO account"}</p>
                    <p className="truncate text-[13px] text-brand-textMuted">{user?.email || user?.phone || "GLAMO customer"}</p>
                  </div>
                </div>
              </div>
              <nav className="grid gap-0.5 p-2" aria-label="Account navigation">
                {navLinks.map(({ name, href, icon: Icon }) => {
                  const active = pathname === href || (href !== "/account" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20",
                        active ? "bg-neutral-950 text-white" : "text-brand-textMuted hover:bg-neutral-50 hover:text-brand-textPrimary",
                      )}
                    >
                      <Icon size={17} strokeWidth={1.7} />
                      {name}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-medium text-red-500 transition-all duration-200 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                >
                  <LogOut size={17} strokeWidth={1.7} />
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