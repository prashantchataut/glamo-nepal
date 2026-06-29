import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCollection, getCollectionProducts, PRODUCT_COLLECTIONS } from "@/lib/collections";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return PRODUCT_COLLECTIONS.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return createMetadata({ title: "Collection", description: "GLAMO NEPAL beauty collection.", path: `/collections/${slug}` });
  return createMetadata({ title: collection.title, description: collection.seoDescription, path: `/collections/${collection.slug}`, image: collection.image, keywords: [collection.title, "GLAMO NEPAL collection", "beauty Nepal"] });
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();
  const products = getCollectionProducts(collection.slug);

  return (
    <main className="min-h-screen bg-neutral-50">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Collections", path: "/collections" }, { name: collection.title, path: `/collections/${collection.slug}` }])} />
      <section className="relative overflow-hidden border-b border-neutral-200 bg-hero-gradient py-10 md:py-14">
        <div className="container mx-auto grid gap-8 px-4 md:px-6 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-neutral-500 text-primary">{collection.eyebrow}</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-[1.05] text-neutral-900 md:text-7xl">{collection.title}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-500">{collection.description}</p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] border border-neutral-200 bg-white shadow-page-hero">
            <Image src={collection.image} alt={collection.title} fill sizes="(max-width: 1024px) 100vw, 420px" priority className="object-cover" />
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-semibold text-neutral-500 text-primary">Curated edit</p><h2 className="mt-2 font-display text-3xl font-semibold text-neutral-900">{products.length} products</h2></div>
          <p className="max-w-lg text-sm text-neutral-500">A polished GLAMO selection built around routines, occasions and easy Nepal shopping.</p>
        </div>
        {products.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="rounded-[1.5rem] border border-dashed border-brand-secondary/50 bg-white p-12 text-center"><h2 className="font-display text-3xl font-semibold text-neutral-900">No products yet</h2><p className="mt-2 text-neutral-500">Add products to this collection once supplier data is ready.</p></div>}
      </section>
    </main>
  );
}
