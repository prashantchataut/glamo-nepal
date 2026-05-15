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
    <main className="min-h-screen bg-brand-bgLight">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Brands", path: "/brands" }, { name: brand.name, path: `/brands/${brand.slug}` }])} />
      <section className="relative overflow-hidden border-b border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_48%,#F7F1EA_100%)] py-10 md:py-14">
        <div className="container mx-auto grid gap-8 px-4 md:px-6 lg:grid-cols-[1fr_320px] lg:items-center">
          <div>
            <Link href="/brands" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-brand-primary"><ArrowLeft size={16} /> Back to brands</Link>
            <p className="font-label text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">Brand profile</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-[0.96] text-brand-textPrimary md:text-7xl">{brand.name}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-brand-textMuted">{brand.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">{brand.concerns.map((concern) => <span key={concern} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-primary shadow-sm ring-1 ring-brand-border">{concern}</span>)}</div>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-brand-border bg-white shadow-sm"><Image src={brand.image} alt={`${brand.name} brand visual`} fill sizes="(max-width: 1024px) 100vw, 320px" className="object-cover" /></div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        <div className="mb-6 rounded-[2rem] border border-brand-border bg-white p-5 text-sm text-brand-textMuted shadow-sm"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" /><p>GLAMO highlights authenticity-first brand curation. Check product packaging and contact us if you need sourcing or batch details before purchase.</p></div></div>
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-brand-primary">Brand edit</p><h2 className="mt-2 font-display text-3xl font-semibold text-brand-textPrimary">{products.length} products</h2></div><Link href={`/shop?brands=${encodeURIComponent(brand.name)}`} className="text-sm font-bold text-brand-primary underline underline-offset-4">Filter this brand in shop</Link></div>
        {products.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-[2rem] border border-dashed border-brand-secondary/50 bg-white p-12 text-center"><h2 className="font-display text-3xl font-semibold text-brand-textPrimary">No products yet</h2><p className="mt-2 text-brand-textMuted">More products from this brand will be added soon.</p></div>}
      </section>
    </main>
  );
}
