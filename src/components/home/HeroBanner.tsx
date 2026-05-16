import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { IMAGES } from "@/lib/image-library";

const productTiles = [
  {
    name: "COSRX Snail 96 Essence",
    image: IMAGES.heroProducts.cosrx,
    href: "/products/cosrx-advanced-snail-96-mucin-power-essence",
  },
  {
    name: "Cetaphil Gentle Cleanser",
    image: IMAGES.heroProducts.cetaphil,
    href: "/products/cetaphil-gentle-skin-cleanser",
  },
  {
    name: "Maybelline Fit Me",
    image: IMAGES.heroProducts.maybelline,
    href: "/search?q=Maybelline",
  },
];

const serviceNotes = [
  { label: "Authenticity-first", icon: ShieldCheck },
  { label: "Kathmandu dispatch", icon: Truck },
  { label: "Routine edits", icon: Sparkles },
];

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-[#f6e6f4]">
      <div
        className="absolute inset-x-0 bottom-0 h-20 rounded-t-[60%] bg-[#fffaf7]"
        aria-hidden="true"
      />
      <div className="mx-auto grid max-w-[1500px] gap-8 px-5 pb-24 pt-7 sm:px-8 lg:min-h-[690px] lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-8">
        <div className="relative z-10 max-w-[640px]">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary ring-1 ring-white/80">
            <Leaf size={14} aria-hidden="true" /> Premium beauty for Nepal
          </div>
          <h1 className="mt-5 font-display text-[4.8rem] font-semibold leading-[0.78] tracking-[-0.07em] text-neutral-950 sm:text-[6.8rem] lg:text-[8.4rem]">
            Beauty,
            <span className="block italic font-medium text-primary">
              quietly
            </span>
            curated.
          </h1>
          <p className="mt-6 max-w-[34rem] text-[15px] leading-8 text-neutral-700 sm:text-base">
            A softer GLAMO Nepal storefront for skincare, SPF, makeup and
            gifting — real brand names, editorial product photography and a
            calmer shopping rhythm.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-neutral-950 px-8 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-primary"
            >
              Shop the edit <ArrowRight size={15} />
            </Link>
            <Link
              href="/routines"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-950/15 bg-white/70 px-8 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-950 transition-colors hover:border-primary hover:text-primary"
            >
              Build a routine
            </Link>
          </div>
          <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
            {serviceNotes.map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="rounded-[1.4rem] bg-white/70 p-3.5 ring-1 ring-white/80"
              >
                <Icon
                  size={17}
                  className="mb-2 text-primary"
                  aria-hidden="true"
                />
                <span className="block text-[10px] font-semibold uppercase leading-4 tracking-[0.11em] text-neutral-700">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 min-h-[460px] lg:min-h-[610px]">
          <div className="absolute right-0 top-0 hidden h-[500px] w-[69%] overflow-hidden rounded-[3.25rem] bg-white/45 ring-1 ring-white/80 md:block">
            <Image
              src={IMAGES.hero.primary}
              alt="Editorial beauty campaign with soft makeup textures"
              fill
              priority
              className="object-cover object-center"
              sizes="(max-width: 1024px) 70vw, 42vw"
            />
          </div>
          <div className="absolute left-0 top-8 h-[360px] w-[64%] overflow-hidden rounded-[3.25rem] bg-[#f9f4ef] shadow-editorial ring-1 ring-white/90 md:top-0 md:h-[520px] md:w-[51%]">
            <Image
              src={IMAGES.hero.flatlay}
              alt="Skincare bottles arranged on a soft beauty flatlay"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 65vw, 34vw"
            />
          </div>
          <div className="absolute bottom-2 right-0 grid w-[88%] grid-cols-3 gap-3 rounded-[2.25rem] bg-white/92 p-3 shadow-editorial ring-1 ring-white md:w-[70%]">
            {productTiles.map((tile) => (
              <Link
                key={tile.name}
                href={tile.href}
                className="group overflow-hidden rounded-[1.75rem] bg-[#fbf7f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <div className="relative aspect-square">
                  <Image
                    src={tile.image}
                    alt={tile.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="180px"
                  />
                </div>
                <p className="px-3 py-2.5 text-[10px] font-semibold leading-4 text-neutral-700">
                  {tile.name}
                </p>
              </Link>
            ))}
          </div>
          <div className="absolute right-4 top-8 rounded-full bg-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-950 shadow-soft">
            New beauty shelf
          </div>
          <div className="absolute bottom-24 left-3 hidden max-w-[190px] rounded-[1.75rem] bg-neutral-950 px-5 py-4 text-white shadow-editorial md:block">
            <p className="font-display text-3xl leading-none">30+</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/70">
              real brands curated
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
