import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getBrandProfiles } from "@/lib/brands";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Beauty Brands",
  description: "Discover curated skincare, makeup, haircare and Nepal-made beauty brands at GLAMO Nepal.",
  path: "/brands",
});

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function BrandsPage() {
  const brands = getBrandProfiles().sort((a, b) => a.name.localeCompare(b.name));
  const grouped = alphabet.map((letter) => ({
    letter,
    brands: brands.filter((brand) => brand.name.toUpperCase().startsWith(letter)),
  }));

  return (
    <main className="bg-cream-50">
      <section className="border-b border-cream-200 px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-[1180px]">
          <p className="type-label text-brand-rose">Brand directory</p>
          <h1 className="mt-5 max-w-4xl font-display text-display-xl font-light leading-none tracking-[-0.04em] text-ink">
            Curated brands, not endless shelves.
          </h1>
          <p className="mt-7 max-w-2xl text-body-lg leading-8 text-cream-700">
            Browse global favourites, routine staples and Nepal-made beauty stories selected for authenticity, performance and everyday use.
          </p>
          <div className="mt-10 border-b border-cream-200 pb-3">
            <label htmlFor="brand-search" className="sr-only">Search brands</label>
            <input id="brand-search" type="search" placeholder="Search brands..." className="w-full bg-transparent py-4 font-display text-heading-xl text-ink placeholder:text-cream-400 focus:outline-none" />
          </div>
          <nav aria-label="Jump to brand letter" className="mt-8 flex flex-wrap gap-x-4 gap-y-3">
            {alphabet.map((letter) => {
              const disabled = !grouped.find((group) => group.letter === letter)?.brands.length;
              return disabled ? (
                <span key={letter} className="text-sm font-semibold text-cream-300">{letter}</span>
              ) : (
                <a key={letter} href={`#brands-${letter}`} className="text-sm font-semibold text-ink transition hover:text-brand-rose">{letter}</a>
              );
            })}
          </nav>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-[1180px] space-y-14">
          {grouped.filter((group) => group.brands.length).map((group) => (
            <div key={group.letter} id={`brands-${group.letter}`} className="scroll-mt-28">
              <div className="mb-4 flex items-center gap-5">
                <h2 className="font-display text-display-md font-light text-ink">{group.letter}</h2>
                <div className="h-px flex-1 bg-cream-200" />
              </div>
              <div className="divide-y divide-cream-200 border-y border-cream-200">
                {group.brands.map((brand) => (
                  <Link key={brand.slug} href={`/brands/${brand.slug}`} className="group grid min-h-20 grid-cols-[1fr_auto] items-center gap-4 py-5 transition hover:bg-cream-100 md:grid-cols-[80px_1fr_auto] md:px-4">
                    <div className="hidden h-10 items-center justify-center border border-cream-200 bg-cream-50 px-3 text-label-sm font-semibold uppercase tracking-[0.15em] text-cream-400 md:flex">
                      {brand.name.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-display text-heading-lg font-normal text-ink transition group-hover:text-brand-deep">{brand.name}</h3>
                      <p className="mt-1 text-body-sm text-cream-400">{brand.productCount} products · {brand.categories.join(", ") || "Beauty"}</p>
                    </div>
                    <ArrowUpRight size={18} className="text-cream-400 transition group-hover:text-brand-rose" />
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {!brands.length && (
            <div className="grid gap-px bg-cream-200 sm:grid-cols-2 lg:grid-cols-3">
              {["Beauty of Joseon", "COSRX", "Cetaphil", "The Ordinary", "Bioderma", "Maybelline"].map((name) => (
                <div key={name} className="bg-cream-50 p-6">
                  <p className="font-display text-heading-lg text-ink">{name}</p>
                  <p className="mt-2 text-body-sm text-cream-400">Coming soon</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
