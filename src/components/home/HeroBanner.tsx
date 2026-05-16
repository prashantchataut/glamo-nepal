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

export function HeroBanner() {
  return (
    <section className="relative min-h-[calc(100vh-68px)] overflow-hidden bg-cream-50">
      <div className="absolute inset-0 lg:left-[42%]" aria-hidden="true">
        <Image
          src={IMAGES.hero.primary}
          alt="Editorial beauty portrait for GLAMO Nepal"
          fill
          priority
          className="object-cover object-[55%_center]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/20 via-cream-50/10 to-cream-50 lg:bg-gradient-to-r lg:from-cream-50 lg:via-cream-50/30 lg:to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-68px)] max-w-[1480px] px-4 py-16 md:px-8 lg:grid-cols-[0.62fr_0.38fr] lg:items-end lg:py-24">
        <div className="max-w-[830px] pb-8 pt-16 lg:pb-0 lg:pt-24">
          <p className="type-label mb-6 text-brand-deep">Premium beauty curated for Nepal</p>
          <h1 className="font-display text-display-2xl font-light leading-[0.9] tracking-[-0.055em] text-ink">
            Beauty, finally
            <span className="block font-semibold italic text-brand-dark">curated for you.</span>
          </h1>
          <p className="mt-7 max-w-[34rem] text-body-md leading-8 text-cream-700 md:text-body-lg">
            Skincare, makeup and fragrance edited with restraint — authentic global formulas, Nepal-aware routines, and a calmer way to shop beauty.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop"
              className="inline-flex min-h-14 items-center justify-center gap-3 bg-ink px-8 text-label-md font-semibold uppercase tracking-[0.14em] text-cream-50 transition hover:bg-brand-deep"
            >
              Shop the edit <ArrowUpRight size={16} strokeWidth={1.6} />
            </Link>
            <Link
              href="/brands"
              className="inline-flex min-h-14 items-center justify-center border border-ink/20 bg-cream-50/80 px-8 text-label-md font-semibold uppercase tracking-[0.14em] text-ink backdrop-blur-sm transition hover:border-brand-rose hover:text-brand-deep"
            >
              Explore brands
            </Link>
          </div>
        </div>

        <div className="hidden self-end justify-self-end lg:block">
          <Link
            href={heroProduct.href}
            className="group block w-[285px] border border-cream-200 bg-cream-50 p-3 shadow-[0_30px_90px_-60px_rgba(26,15,11,0.45)] transition duration-500 hover:-translate-y-1"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-cream-100">
              <Image
                src={heroProduct.image}
                alt={`${heroProduct.brand} ${heroProduct.name}`}
                fill
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
                sizes="285px"
              />
              <span className="absolute left-3 top-3 bg-cream-50 px-3 py-1 text-label-sm font-semibold uppercase tracking-[0.15em] text-brand-deep">
                New edit
              </span>
            </div>
            <div className="px-1 py-4">
              <p className="type-label-sm">{heroProduct.brand}</p>
              <p className="mt-1 font-display text-heading-lg leading-tight text-ink">{heroProduct.name}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-display text-price-md text-ink">{heroProduct.price}</span>
                <ArrowUpRight size={17} className="text-brand-rose transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="relative z-10 border-y border-cream-200 bg-cream-50/92 backdrop-blur-sm">
        <div className="mx-auto grid max-w-[1480px] gap-0 px-4 md:grid-cols-3 md:px-8">
          {[
            { icon: ShieldCheck, title: "100% Authentic", text: "Verified catalog only" },
            { icon: Truck, title: "Kathmandu dispatch", text: "Fast delivery windows" },
            { icon: ArrowUpRight, title: "Routine edits", text: "Beauty guidance by concern" },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-4 border-cream-200 py-5 md:border-l md:px-8 first:md:border-l-0">
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
