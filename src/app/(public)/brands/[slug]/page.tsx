import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { getBrandProducts, getBrandProfile, getBrandProfiles } from "@/lib/brands";
import { breadcrumbJsonLd, createMetadata } from "@/lib/seo";

export function generateStaticParams() { return getBrandProfiles().map((brand) => ({ slug: brand.slug })); }
export function generateMetadata({ params }: { params: { slug: string } }) {
  const brand = getBrandProfile(params.slug);
  return createMetadata({ title: brand ? `${brand.name} Products` : "Brand", description: brand?.description || "GLAMO NEPAL brand page.", path: `/brands/${params.slug}`, image: brand?.image, keywords: brand ? [brand.name, "beauty Nepal", ...brand.categories, ...brand.concerns] : ["GLAMO brand"] });
}

export default function BrandDetailPage({ params }: { params: { slug: string } }) {
  const brand = getBrandProfile(params.slug);
  if (!brand) notFound();
  const products = getBrandProducts(brand.slug);
  return (
    <main className="min-h-screen bg-neutral-50">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Brands", path: "/brands" }, { name: brand.name, path: `/brands/${brand.slug}` }])} />
      <section className="relative overflow-hidden border-b border-neutral-200 bg-neutral-50 py-12 md:py-20">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="container mx-auto grid gap-8 px-4 md:px-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <Link href="/brands" className="mb-7 inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-primary transition-colors hover:text-neutral-900"><ArrowLeft size={16} /> Back to brands</Link>
            <p className="type-label text-xs font-bold uppercase tracking-[0.24em] text-primary">Brand profile</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-[0.96] text-neutral-900 md:text-7xl">{brand.name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-500">{brand.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {brand.concerns.map((concern) => (
                <span key={concern} className="border border-neutral-200 bg-white px-3 py-1 text-xs font-bold text-primary">{concern}</span>
              ))}
            </div>
          </div>
          <div className="relative aspect-square overflow-hidden border border-neutral-200 bg-white">
            <Image src={brand.image} alt={`${brand.name} brand visual`} fill sizes="(max-width: 1024px) 100vw, 320px" className="object-cover" />
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <div className="mb-6 border border-neutral-200 bg-white p-5 text-sm text-neutral-500">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" strokeWidth={1.5} />
            <p>GLAMO highlights authenticity-first brand curation. Check product packaging and contact us if you need sourcing or batch details before purchase.</p>
          </div>
        </div>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="type-label text-xs font-bold uppercase tracking-[0.22em] text-primary">Brand edit</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-neutral-900">{products.length} products</h2>
          </div>
          <Link href={`/shop?brands=${encodeURIComponent(brand.name)}`} className="text-sm font-bold text-primary underline underline-offset-4 transition-colors hover:text-neutral-900">
            Filter this brand in shop
          </Link>
        </div>
        {products.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="border border-dashed border-secondary/50 bg-white p-12 text-center">
            <h2 className="font-display text-3xl font-semibold text-neutral-900">No products yet</h2>
            <p className="mt-2 text-neutral-500">More products from this brand will be added soon.</p>
          </div>
        )}
      </section>
    </main>
  );
}