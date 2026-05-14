import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Sparkles, Store } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SITE_CONFIG } from "@/lib/constants";
import { CATEGORIES } from "@/lib/data/products";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = createMetadata({
  title: "About GLAMO NEPAL",
  description: "Learn about GLAMO NEPAL, a premium beauty and cosmetics storefront in Naya Baneshwor, Kathmandu.",
  path: "/about",
  keywords: ["about GLAMO NEPAL", "beauty store Nepal", "skincare Kathmandu", "Nepal cosmetics"],
});

const pillars = [
  { icon: <Sparkles className="text-brand-primary" size={26} />, title: "Premium Nepali beauty", body: "A curated beauty experience for skincare, makeup, haircare, fragrance and beauty tools with रू pricing." },
  { icon: <ShieldCheck className="text-brand-primary" size={26} />, title: "Authenticity-first curation", body: "Product pages highlight authentic ingredients, clear sourcing and honest beauty guidance." },
  { icon: <Store className="text-brand-primary" size={26} />, title: "Kathmandu-ready", body: `Visit us at ${SITE_CONFIG.address}, message us on WhatsApp or pick up in store.` },
];

export default function AboutPage() {
  return (
    <main className="bg-brand-bgLight">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <PageHeader eyebrow="Our story" title="Premium beauty from the heart of Kathmandu" description={`${SITE_CONFIG.fullTitle} is a premium Nepali beauty and cosmetics storefront based at ${SITE_CONFIG.address}.`} />
      <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-2xl bg-white p-7 shadow-sm">
            <MapPin className="text-brand-primary" size={30} />
            <h2 className="mt-4 font-serif text-4xl font-semibold text-brand-textPrimary">Built for the Nepal beauty customer</h2>
            <p className="mt-4 leading-7 text-brand-textMuted">GLAMO NEPAL brings customers polished product discovery, Nepal-relevant delivery information, local payment options and a premium beauty experience that feels trustworthy from the first visit.</p>
            <div className="mt-6 space-y-2 text-sm text-brand-textMuted">
              <p><strong className="text-brand-textPrimary">Phone:</strong> <a href={SITE_CONFIG.whatsapp} target="_blank" rel="noopener noreferrer" className="text-brand-textMuted hover:text-brand-primary transition-colors">{SITE_CONFIG.phone}</a></p>
              <p><strong className="text-brand-textPrimary">Email:</strong> <a href={`mailto:${SITE_CONFIG.email}`} className="text-brand-textMuted hover:text-brand-primary transition-colors">{SITE_CONFIG.email}</a></p>
              <p><strong className="text-brand-textPrimary">Address:</strong> {SITE_CONFIG.address}</p>
              <p><strong className="text-brand-textPrimary">Hours:</strong> Sun–Fri 10AM–7PM, Sat 10AM–5PM</p>
              <p><strong className="text-brand-textPrimary">Instagram:</strong> {SITE_CONFIG.instagramHandle}</p>
              <p><strong className="text-brand-textPrimary">Payments:</strong> {SITE_CONFIG.paymentMethods.join(", ")}</p>
            </div>
            <Link href="/shop" className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-primary px-7 py-3 font-semibold text-white transition hover:bg-brand-bgDark">Explore shop <ArrowRight size={17} /></Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1">
            {pillars.map(({ icon, title, body }) => (
              <article key={title} className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                {icon}
                <h3 className="mt-4 font-serif text-2xl font-semibold text-brand-textPrimary">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-brand-textMuted">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 pb-12 md:px-6 md:pb-16">
        <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Shop by category</h2>
        <p className="mt-2 text-sm text-brand-textMuted">Browse our curated selection across every beauty category.</p>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((category) => (
            <Link key={category.slug} href={`/category/${category.slug}`} className="group rounded-2xl border border-border/70 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <p className="font-semibold text-brand-textPrimary group-hover:text-brand-primary">{category.name}</p>
              <p className="mt-1 text-xs text-brand-textMuted">{category.subCategories.slice(0, 2).join(", ")}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}