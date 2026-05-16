import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, ShieldCheck, Sparkles, Store } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { IMAGES } from "@/lib/image-library";
import { SITE_CONFIG } from "@/lib/config";
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
  { icon: <Sparkles className="text-primary" size={26} strokeWidth={1.5} />, title: "Premium Nepali beauty", body: "A curated beauty experience for skincare, makeup, haircare, fragrance and beauty tools with रू pricing." },
  { icon: <ShieldCheck className="text-primary" size={26} strokeWidth={1.5} />, title: "Authenticity-first curation", body: "Product pages highlight authentic ingredients, clear sourcing and honest beauty guidance." },
  { icon: <Store className="text-primary" size={26} strokeWidth={1.5} />, title: "Kathmandu-ready", body: `Visit us at ${SITE_CONFIG.address}, message us on WhatsApp or pick up in store.` },
];

export default function AboutPage() {
  return (
    <main className="bg-neutral-50">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />
      <PageHeader eyebrow="Our story" title="Premium beauty from the heart of Kathmandu" description={`${SITE_CONFIG.fullTitle} is a premium Nepali beauty and cosmetics storefront based at ${SITE_CONFIG.address}.`} />
      <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative aspect-[4/5] overflow-hidden border border-neutral-200 bg-neutral-100 shadow-editorial">
            <Image src={IMAGES.editorial.about} alt="Premium beauty studio scene for GLAMO Nepal" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          <div className="border border-neutral-200 bg-white p-7 md:p-9">
            <MapPin className="text-primary" size={30} strokeWidth={1.5} />
            <h2 className="mt-4 font-display text-4xl font-semibold text-neutral-900">Built for the Nepal beauty customer</h2>
            <p className="mt-4 leading-7 text-neutral-500">GLAMO NEPAL brings customers polished product discovery, Nepal-relevant delivery information, local payment options and a premium beauty experience that feels trustworthy from the first visit.</p>
            <div className="mt-6 space-y-2 text-sm text-neutral-500">
              <p><strong className="text-neutral-900">Phone:</strong> <a href={SITE_CONFIG.whatsapp} target="_blank" rel="noopener noreferrer" className="cursor-pointer text-neutral-500 transition-colors hover:text-primary">{SITE_CONFIG.phone}</a></p>
              <p><strong className="text-neutral-900">Email:</strong> <a href={`mailto:${SITE_CONFIG.email}`} className="cursor-pointer text-neutral-500 transition-colors hover:text-primary">{SITE_CONFIG.email}</a></p>
              <p><strong className="text-neutral-900">Address:</strong> {SITE_CONFIG.address}</p>
              <p><strong className="text-neutral-900">Hours:</strong> Sun–Fri 10AM–7PM, Sat 10AM–5PM</p>
              <p><strong className="text-neutral-900">Instagram:</strong> {SITE_CONFIG.instagramHandle}</p>
              <p><strong className="text-neutral-900">Payments:</strong> {SITE_CONFIG.paymentMethods.join(", ")}</p>
            </div>
            <Link href="/shop" className="mt-7 inline-flex cursor-pointer items-center gap-2 bg-primary px-7 py-3 text-[13px] font-medium uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-dark">
              Explore shop <ArrowRight size={17} strokeWidth={1.5} />
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3 lg:col-span-2">
            {pillars.map(({ icon, title, body }) => (
              <article key={title} className="border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-lg">
                {icon}
                <h3 className="mt-4 font-display text-2xl font-semibold text-neutral-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-500">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 pb-12 md:px-6 md:pb-16">
        <h2 className="font-display text-3xl font-semibold text-neutral-900">Shop by category</h2>
        <p className="mt-2 text-sm text-neutral-500">Browse our curated selection across every beauty category.</p>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((category) => (
            <Link key={category.slug} href={`/shop?category=${category.slug}`} className="group cursor-pointer border border-neutral-200 bg-white p-4 text-center transition-shadow hover:shadow-lg">
              <p className="font-semibold text-neutral-900 transition-colors group-hover:text-primary">{category.name}</p>
              <p className="mt-1 text-xs text-neutral-400">{category.subCategories.slice(0, 2).join(", ")}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}