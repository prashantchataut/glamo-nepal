import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Sparkles, Store } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SITE_CONFIG } from "@/lib/constants";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "About GLAMO NEPAL",
  description: "Learn about GLAMO NEPAL, a premium beauty and cosmetics storefront in Naya Baneshwor, Kathmandu.",
  path: "/about",
});

const pillars = [
  { icon: Sparkles, title: "Premium Nepali beauty", body: "A curated beauty experience for skincare, makeup, haircare, fragrance and beauty tools with NPR-first shopping." },
  { icon: ShieldCheck, title: "Authenticity-first curation", body: "Product pages highlight authentic ingredients, clear sourcing and honest beauty guidance." },
  { icon: Store, title: "Kathmandu-ready", body: `Store, WhatsApp and pickup messaging centers on ${SITE_CONFIG.address}.` },
];

export default function AboutPage() {
  return (
    <main className="bg-brand-bgLight">
      <PageHeader eyebrow="Our story" title="Premium beauty from the heart of Kathmandu" description={`${SITE_CONFIG.fullTitle} is positioned as a premium Nepali beauty and cosmetics storefront based at ${SITE_CONFIG.address}.`} />
      <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="rounded-[2rem] bg-white p-7 shadow-sm">
            <MapPin className="text-brand-primary" size={30} />
            <h2 className="mt-4 font-serif text-4xl font-semibold text-brand-textPrimary">Built for the Nepal beauty customer</h2>
            <p className="mt-4 leading-7 text-brand-textMuted">GLAMO NEPAL is designed for customers who want polished product discovery, Nepal-relevant delivery information, local payment options and a premium beauty experience that feels trustworthy from the first visit.</p>
            <div className="mt-6 space-y-2 text-sm text-brand-textMuted">
              <p><strong className="text-brand-textPrimary">Phone:</strong> {SITE_CONFIG.phone}</p>
              <p><strong className="text-brand-textPrimary">Instagram:</strong> {SITE_CONFIG.instagramHandle}</p>
              <p><strong className="text-brand-textPrimary">Payments:</strong> {SITE_CONFIG.paymentMethods.join(", ")}</p>
            </div>
            <Link href="/shop" className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand-primary px-7 py-3 font-semibold text-white transition hover:bg-brand-bgDark">Explore shop <ArrowRight size={17} /></Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-1">
            {pillars.map(({ icon: Icon, title, body }) => (
              <article key={title} className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <Icon className="text-brand-primary" size={26} />
                <h3 className="mt-4 font-serif text-2xl font-semibold text-brand-textPrimary">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-brand-textMuted">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
