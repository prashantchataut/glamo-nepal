import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBrandProducts, getBrandProfile, getBrandProfiles } from "@/lib/brands";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return getBrandProfiles().map((brand) => ({ slug: brand.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const brand = getBrandProfile(params.slug);
  return createMetadata({
    title: brand ? `${brand.name} Products` : "Brand",
    description: brand?.description || "GLAMO NEPAL brand page.",
    path: `/brands/${params.slug}`,
    image: brand?.image,
    keywords: brand ? [brand.name, "beauty Nepal", ...brand.categories, ...brand.concerns] : ["GLAMO brand"],
  });
}

export default function BrandDetailPage({ params }: { params: { slug: string } }) {
  const brand = getBrandProfile(params.slug);
  if (!brand) notFound();
  const products = getBrandProducts(brand.slug);

  return (
    <main className="min-h-screen bg-brand-bgLight">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Brands", path: "/brands" }, { name: brand.name, path: `/brands/${brand.slug}` }])} />
      <section className="bg-brand-bgDark text-white">
        <div className="container mx-auto grid gap-8 px-4 py-14 md:px-6 lg:grid-cols-[1fr_280px] lg:py-20">
          <div>
            <Link href="/brands" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"><ArrowLeft size={16} /> Back to brands</Link>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">Brand profile</p>
            <h1 className="mt-3 font-serif text-5xl font-semibold md:text-6xl">{brand.name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">{brand.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {brand.concerns.map((concern) => <span key={concern} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{concern}</span>)}
            </div>
          </div>
          <div className="relative h-56 overflow-hidden rounded-[2rem] bg-white/10">
            <Image src={brand.image} alt={`${brand.name} placeholder logo`} fill className="object-cover" />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        <div className="mb-6 rounded-[2rem] border border-amber-300/60 bg-amber-50 p-5 text-sm text-amber-900">
          <div className="flex gap-3"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" /><p>Brand page is frontend-only. Confirm authorization, distributor documents, logo permissions, batch/expiry data and final MRP before public launch.</p></div>
        </div>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Catalog preview</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-textPrimary">{products.length} products</h2>
          </div>
          <Link href={`/shop?brands=${encodeURIComponent(brand.name)}`} className="text-sm font-semibold text-brand-primary underline underline-offset-4">Filter this brand in shop</Link>
        </div>
        {products.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-brand-secondary/40 bg-white p-12 text-center">
            <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">No products yet</h2>
            <p className="mt-2 text-brand-textMuted">Add supplier-approved products before publishing this brand.</p>
          </div>
        )}
      </section>
    </main>
  );
}
