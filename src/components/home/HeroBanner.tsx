import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Truck } from "lucide-react";
import { IMAGES } from "@/lib/image-library";

const heroProduct = {
  brand: "Beauty of Joseon",
  name: "Relief Sun SPF50+",
  price: "NPR 2,250",
  image: IMAGES.heroProducts.boj,
  href: "/products/beauty-of-joseon-relief-sun-spf50",
};

const trustNotes = [
  { icon: ShieldCheck, title: "100% Authentic", text: "Supplier-verified catalog" },
  { icon: Truck, title: "Nepal delivery", text: "District-aware dispatch" },
  { icon: ArrowUpRight, title: "Routine edits", text: "Curated by concern" },
];

export function HeroBanner() {
  return (
    <section className="relative isolate overflow-hidden bg-cream-50">
      <div className="grid min-h-[calc(100svh-64px)] lg:min-h-[calc(100vh-68px)] lg:grid-cols-[0.48fr_0.52fr]">
        <div className="relative order-1 min-h-[68svh] overflow-hidden lg:order-2 lg:min-h-[calc(100vh-68px)]">
          <Image
            src={IMAGES.hero.primary}
            alt="Editorial beauty portrait for GLAMO Nepal"
            fill
            priority
            className="object-cover object-[58%_center]"
            sizes="(max-width: 1024px) 100vw, 58vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/5 via-transparent to-cream-50/88 lg:bg-gradient-to-r lg:from-cream-50/25 lg:via-transparent lg:to-transparent" />

          <Link
            href={heroProduct.href}
            className="group absolute bottom-5 right-4 z-10 w-[min(76vw,260px)] border border-cream-200 bg-cream-50/94 p-2 shadow-[0_24px_80px_-50px_rgba(26,15,11,0.55)] backdrop-blur-sm transition duration-500 hover:-translate-y-1 sm:right-6 lg:bottom-10 lg:left-[-88px] lg:right-auto lg:w-[286px] lg:bg-cream-50"
          >
            <div className="grid grid-cols-[74px_minmax(0,1fr)] gap-3 lg:block">
              <div className="relative aspect-[4/5] overflow-hidden bg-cream-100 lg:aspect-[4/5]">
                <Image
                  src={heroProduct.image}
                  alt={`${heroProduct.brand} ${heroProduct.name}`}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                  sizes="(max-width: 1024px) 74px, 286px"
                />
              </div>
              <div className="min-w-0 py-1 lg:px-1 lg:py-4">
                <p className="type-label-sm truncate text-brand-deep">New edit</p>
                <p className="mt-1 line-clamp-2 font-display text-[1.45rem] leading-[0.95] text-ink lg:text-heading-lg">{heroProduct.name}</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-display text-price-md text-ink">{heroProduct.price}</span>
                  <ArrowUpRight size={17} className="shrink-0 text-brand-rose transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="relative order-2 z-10 -mt-10 px-4 pb-10 lg:order-1 lg:mt-0 lg:flex lg:min-h-[calc(100vh-68px)] lg:items-end lg:px-8 lg:pb-20">
          <div className="w-full max-w-[820px] bg-cream-50/92 px-0 pt-8 backdrop-blur-[2px] lg:bg-transparent lg:pt-0 lg:backdrop-blur-0">
            <p className="type-label mb-5 text-brand-deep">Premium beauty curated for Nepal</p>
            <h1 className="max-w-[10ch] text-balance font-display text-[clamp(3.25rem,16vw,5rem)] font-light leading-[0.88] tracking-[-0.055em] text-ink sm:text-display-xl lg:max-w-[9.5ch] lg:text-display-2xl">
              Beauty, finally
              <span className="block font-semibold italic text-brand-dark">curated for you.</span>
            </h1>
            <p className="mt-6 max-w-[34rem] text-body-md leading-8 text-cream-700 md:text-body-lg">
              Skincare, makeup and fragrance edited with restraint — authentic global formulas, Nepal-aware routines, and a calmer way to shop beauty.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/shop"
                className="inline-flex min-h-14 items-center justify-center gap-3 bg-ink px-8 text-label-md font-semibold uppercase tracking-[0.14em] text-cream-50 transition hover:bg-brand-deep"
              >
                Shop the edit <ArrowUpRight size={16} strokeWidth={1.6} />
              </Link>
              <Link
                href="/brands"
                className="inline-flex min-h-14 items-center justify-center border border-ink/20 bg-cream-50 px-8 text-label-md font-semibold uppercase tracking-[0.14em] text-ink transition hover:border-brand-rose hover:text-brand-deep"
              >
                Explore brands
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="border-y border-cream-200 bg-cream-50">
        <div className="mx-auto grid max-w-[1480px] divide-y divide-cream-200 px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 md:px-8">
          {trustNotes.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex min-h-[76px] items-center gap-4 py-4 md:px-8">
              <Icon size={18} className="text-brand-rose" strokeWidth={1.5} />
              <div>
                <p className="text-label-sm font-semibold uppercase tracking-[0.15em] text-ink">{title}</p>
                <p className="mt-1 text-body-sm text-cream-700">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
