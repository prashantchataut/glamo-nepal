"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LayoutDashboard, LockKeyhole, LogOut, MapPin, Package, UserRound } from "lucide-react";
import { toast } from "sonner";
import { MOCK_USER } from "@/lib/mock/users";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";

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
  const sessionUser = useAuthStore((state) => state.user);
  const user = sessionUser ?? MOCK_USER;

  const handleLogout = () => {
    document.cookie = "glamo-auth-token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "glamo-user-role=; path=/; max-age=0; SameSite=Lax";
    logout();
    toast.success("Logged out of GLAMO account.");
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-brand-bgLight">
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-white shadow-sm">
              <div className="bg-brand-bgDark p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/10 font-serif text-xl font-semibold text-brand-gold ring-1 ring-white/15">
                    {user.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-white/65">{user.email}</p>
                  </div>
                </div>
                <p className="mt-4 rounded-full bg-white/10 px-4 py-2 text-center text-xs font-bold uppercase tracking-[0.16em] text-white/80">
                  {user.loyaltyPoints.toLocaleString()} glow points
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
                        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand-primary/25",
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
