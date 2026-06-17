import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { EditorialSection } from "@/components/common/EditorialPage";
import { getBrandProfile, getBrandProducts, getBrandProfiles } from "@/lib/brands";
import { IMAGES } from "@/lib/image-library";
import { createMetadata } from "@/lib/seo";

export function generateStaticParams() { return getBrandProfiles().map((brand) => ({ slug: brand.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = getBrandProfile(slug);
  return createMetadata({ title: brand ? `${brand.name} at GLAMO Nepal` : "Brand Not Found", description: brand?.description || "Explore GLAMO Nepal brand edits.", path: `/brands/${slug}`, image: brand?.image });
}

export default async function BrandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const brand = getBrandProfile(slug);
  if (!brand) notFound();
  const products = getBrandProducts(slug);
  return (
    <main className="bg-neutral-50">
      <section className="border-b border-neutral-200 bg-neutral-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8">
          <div className="relative aspect-[4/3] overflow-hidden border border-neutral-200 bg-white">
            <Image src={brand.image || IMAGES.hero.secondary} alt={`${brand.name} brand artwork`} fill className="object-contain p-10" sizes="(max-width: 1024px) 100vw, 40vw" priority />
          </div>
          <div>
            <Link href="/brands" className="text-sm font-semibold text-primary">← All brands</Link>
            <h1 className="mt-4 font-display text-5xl font-medium leading-[1.05] text-neutral-900 md:text-7xl">{brand.name}</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600">{brand.description}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="border border-neutral-200 bg-white p-4"><p className="text-2xl font-semibold text-neutral-900">{brand.productCount}</p><p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Products</p></div>
              <div className="border border-neutral-200 bg-white p-4"><p className="text-2xl font-semibold text-neutral-900">{brand.madeInNepalCount}</p><p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Made in Nepal</p></div>
              <div className="border border-neutral-200 bg-white p-4"><p className="text-2xl font-semibold text-neutral-900">{brand.categories.length}</p><p className="text-xs uppercase tracking-[0.14em] text-neutral-500">Categories</p></div>
            </div>
          </div>
        </div>
      </section>
      <EditorialSection title={`Shop ${brand.name}`} description="Product cards use GLAMO's standard storefront layout for consistent browsing, price comparison and quick add behavior.">
        {products.length ? <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="border border-neutral-200 bg-white p-10 text-center"><h2 className="font-display text-3xl text-neutral-900">This brand edit is coming soon.</h2><p className="mt-3 text-neutral-600">Check back for new arrivals or browse the full shop.</p><Link href="/shop" className="mt-6 inline-flex bg-primary px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white">Browse shop</Link></div>}
      </EditorialSection>
    </main>
  );
}
