import Link from "next/link";
import { Heart, MapPin, Package, Sparkles, UserRound } from "lucide-react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "My Account",
  description: "Manage your GLAMO NEPAL profile, orders, wishlist, addresses and beauty preferences.",
  path: "/account",
  noIndex: true,
});

const cards = [
  { title: "Orders", description: "Track purchases, delivery updates and invoices.", href: "/account/orders", icon: Package },
  { title: "Profile", description: "Update your contact details and beauty profile.", href: "/account/profile", icon: UserRound },
  { title: "Wishlist", description: "Return to saved skincare, makeup and gifting picks.", href: "/account/wishlist", icon: Heart },
  { title: "Addresses", description: "Manage Nepal delivery addresses for faster checkout.", href: "/account/addresses", icon: MapPin },
];

export default function AccountDashboardPage() {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Account</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-brand-textPrimary md:text-5xl">Welcome to your GLAMO account</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-textMuted">View orders, keep delivery details ready and revisit your favorite beauty picks.</p>

      <section className="mt-8 rounded-[2rem] border border-brand-secondary/25 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-semibold text-brand-textPrimary">Glow points</h2>
            <p className="mt-2 text-sm leading-6 text-brand-textMuted">Earn points and enjoy a smoother shopping experience with every GLAMO order.</p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {cards.map(({ title, description, href, icon: Icon }) => (
          <Link key={href} href={href} className="group rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-primary/25 hover:shadow-md">
            <Icon className="text-brand-primary" size={24} />
            <h2 className="mt-4 font-serif text-2xl font-semibold text-brand-textPrimary group-hover:text-brand-primary">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-brand-textMuted">{description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
