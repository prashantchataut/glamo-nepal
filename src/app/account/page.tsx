import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { SAMPLE_ORDERS } from "@/lib/data/orders";
import { SAMPLE_ADDRESSES, SAMPLE_USER } from "@/lib/data/users";
import { PRODUCTS } from "@/lib/data/products";
import { createMetadata } from "@/lib/seo";
import { formatNpr } from "@/lib/utils";

export const metadata = createMetadata({
  title: "My Account",
  description: "Manage your GLAMO NEPAL profile, orders, wishlist, addresses and beauty preferences.",
  path: "/account",
  noIndex: true,
});

export default function AccountDashboardPage() {
  const recentOrder = SAMPLE_ORDERS[0];
  const wishlistPreview = PRODUCTS.filter((product) => product.isBestSeller || product.isNewArrival).slice(0, 3);
  const defaultAddress = SAMPLE_ADDRESSES.find((address) => address.isDefault) || SAMPLE_ADDRESSES[0];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-brand-border bg-[linear-gradient(135deg,#FFFDFC_0%,#F8EEF2_52%,#F7F1EA_100%)] p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-secondary/35 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">GLAMO account</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-brand-textPrimary md:text-6xl">Welcome back, {SAMPLE_USER.name.split(" ")[0]}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-textMuted">Review orders, saved delivery details and wishlist picks from a customer area that matches the storefront.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-[1.5rem] border border-white/80 bg-white/70 p-3 text-center shadow-sm backdrop-blur">
            <Metric label="Orders" value={SAMPLE_ORDERS.length} />
            <Metric label="Wishlist" value={wishlistPreview.length} />
            <Metric label="Points" value={SAMPLE_USER.loyaltyPoints.toLocaleString()} />
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        <QuickLink href="/account/orders" icon={Package} title="Orders" body="Track delivery, payment and invoices" />
        <QuickLink href="/account/wishlist" icon={Heart} title="Wishlist" body="Review saved GLAMO beauty picks" />
        <QuickLink href="/account/addresses" icon={MapPin} title="Addresses" body="Manage Kathmandu/Nepal delivery" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-primary">Recent order</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-textPrimary">{recentOrder.orderNumber}</h2>
              <p className="mt-1 text-sm text-brand-textMuted">{recentOrder.date} · {recentOrder.paymentMethod}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">{recentOrder.status}</span>
          </div>
          <div className="mt-5 space-y-3">
            {recentOrder.items.map((item) => (
              <div key={`${item.name}-${item.quantity}`} className="flex items-center gap-3 rounded-2xl bg-brand-bgLight p-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-white"><Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" /></div>
                <div className="min-w-0 flex-1"><p className="truncate font-semibold text-brand-textPrimary">{item.name}</p><p className="text-xs text-brand-textMuted">{item.brand} · Qty {item.quantity}</p></div>
                <p className="font-bold text-brand-textPrimary">{formatNpr(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <Link href="/account/orders" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-primary">View order history <ArrowRight size={16} /></Link>
        </section>

        <section className="rounded-[2rem] border border-brand-border bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary-light text-brand-primary"><ShieldCheck size={20} /></span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-primary">Default delivery</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-textPrimary">{defaultAddress.label}</h2>
              <p className="mt-2 text-sm leading-7 text-brand-textMuted">{defaultAddress.address}, {defaultAddress.city}, {defaultAddress.district}, {defaultAddress.province}</p>
              <p className="mt-1 text-sm text-brand-textMuted">{defaultAddress.phone}</p>
            </div>
          </div>
          <div className="mt-6 rounded-[1.5rem] bg-brand-bgLight p-5">
            <div className="flex items-center gap-2 text-brand-primary"><Sparkles size={17} /><p className="text-xs font-bold uppercase tracking-[0.18em]">Beauty profile</p></div>
            <p className="mt-3 text-sm leading-6 text-brand-textMuted">Add skin type, concerns and shade preferences later to power routine recommendations and restock alerts.</p>
          </div>
          <Link href="/account/profile" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-primary">Edit profile <ArrowRight size={16} /></Link>
        </section>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl bg-brand-bgLight px-4 py-3"><p className="font-serif text-2xl font-semibold text-brand-textPrimary">{value}</p><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-textMuted">{label}</p></div>;
}

function QuickLink({ href, icon: Icon, title, body }: { href: string; icon: LucideIcon; title: string; body: string }) {
  return (
    <Link href={href} className="group rounded-[1.75rem] border border-brand-border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-primary/25 hover:shadow-md">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary-light text-brand-primary transition group-hover:bg-brand-primary group-hover:text-white"><Icon size={20} /></span>
      <h2 className="mt-4 font-serif text-3xl font-semibold text-brand-textPrimary">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-brand-textMuted">{body}</p>
    </Link>
  );
}
