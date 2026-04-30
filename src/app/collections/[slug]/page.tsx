import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { JsonLd } from "@/components/seo/JsonLd";
import { getCollection, getCollectionProducts, PRODUCT_COLLECTIONS } from "@/lib/collections";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return PRODUCT_COLLECTIONS.map((collection) => ({ slug: collection.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const collection = getCollection(params.slug);
  if (!collection) return createMetadata({ title: "Collection", description: "GLAMO NEPAL beauty collection.", path: `/collections/${params.slug}` });
  return createMetadata({
    title: collection.title,
    description: collection.seoDescription,
    path: `/collections/${collection.slug}`,
    image: collection.image,
    keywords: [collection.title, "GLAMO NEPAL collection", "beauty Nepal"],
  });
}

export default function CollectionPage({ params }: { params: { slug: string } }) {
  const collection = getCollection(params.slug);
  if (!collection) notFound();
  const products = getCollectionProducts(collection.slug);

  return (
    <main className="min-h-screen bg-brand-bgLight">
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Collections", path: "/shop" }, { name: collection.title, path: `/collections/${collection.slug}` }])} />
      <section className="bg-brand-bgDark py-16 text-white md:py-24">
        <div className="container mx-auto px-4 text-center md:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">{collection.eyebrow}</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold md:text-6xl">{collection.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/72 md:text-base">{collection.description}</p>
        </div>
      </section>
      <section className="container mx-auto px-4 py-10 md:px-6 md:py-14">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Curated edit</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-brand-textPrimary">{products.length} products</h2>
          </div>
          <p className="max-w-lg text-sm text-brand-textMuted">Explore curated GLAMO selections built around beauty routines, occasions and easy Nepal shopping.</p>
        </div>
        {products.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-brand-secondary/40 bg-white p-12 text-center">
            <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">No products yet</h2>
            <p className="mt-2 text-brand-textMuted">Add products to this collection once real supplier data is ready.</p>
          </div>
        )}
      </section>
    </main>
  );
}
