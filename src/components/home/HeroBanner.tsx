import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { IMAGES } from "@/lib/image-library";

const heroProducts = [
  {
    brand: "COSRX",
    name: "Snail 96 Essence",
    image: IMAGES.heroProducts.cosrx,
    href: "/products/cosrx-advanced-snail-96-mucin-power-essence",
  },
  {
    brand: "Beauty of Joseon",
    name: "Relief Sun SPF50+",
    image: IMAGES.heroProducts.boj,
    href: "/products/beauty-of-joseon-relief-sun-spf50",
  },
  {
    brand: "Maybelline",
    name: "Fit Me Foundation",
    image: IMAGES.heroProducts.maybelline,
    href: "/products/maybelline-fit-me-matte-poreless-foundation",
  },
];

const trustNotes = [
  { label: "Authentic catalog", value: "40+", icon: ShieldCheck },
  { label: "Kathmandu dispatch", value: "1-2d", icon: Truck },
  { label: "Routine edits", value: "Nepal", icon: Sparkles },
];

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-[#f6e2f4]">
      <div className="mx-auto grid max-w-[1480px] gap-8 px-4 pb-16 pt-7 sm:px-6 md:pb-20 lg:min-h-[640px] lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-8">
        <div className="relative z-10 mx-auto max-w-[660px] text-center lg:mx-0 lg:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-neutral-700">
            Premium beauty curated for Nepal
          </p>
          <h1 className="mt-4 font-display text-[4.1rem] font-semibold leading-[0.82] tracking-[-0.07em] text-neutral-950 sm:text-[5.8rem] md:text-[7rem] lg:text-[8rem]">
            Clean Beauty
            <span className="block italic font-medium text-[#7a377f]">Made Easy.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-[34rem] text-[15px] leading-7 text-neutral-700 sm:text-base lg:mx-0">
            Shop skincare, SPF, makeup and body care from trusted global names and Nepal-aware routine edits — softer, clearer and ready for real shoppers.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/shop"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-neutral-950 px-8 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#7a377f]"
            >
              View all products <ArrowRight size={15} strokeWidth={1.8} />
            </Link>
            <Link
              href="/brands"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-950/15 bg-white/70 px-8 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-950 transition hover:border-[#7a377f] hover:text-[#7a377f]"
            >
              Explore brands
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-2.5 sm:gap-3">
            {trustNotes.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-[22px] border border-white/85 bg-white/72 px-3 py-3 text-left shadow-[0_16px_45px_-38px_rgba(26,21,18,0.45)]">
                <Icon size={16} className="mb-2 text-[#7a377f]" strokeWidth={1.7} aria-hidden="true" />
                <span className="block font-display text-2xl font-semibold leading-none text-neutral-950">{value}</span>
                <span className="mt-1 block text-[10px] font-semibold uppercase leading-4 tracking-[0.1em] text-neutral-600">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-[780px] lg:max-w-none">
          <div className="relative min-h-[430px] sm:min-h-[540px] lg:min-h-[610px]">
            <div className="absolute left-0 top-6 h-[64%] w-[55%] overflow-hidden rounded-[42px] bg-white shadow-[0_30px_95px_-68px_rgba(26,21,18,0.55)] ring-1 ring-white/90 sm:rounded-[54px] lg:top-0 lg:h-[72%]">
              <Image
                src={IMAGES.hero.flatlay}
                alt="Premium skincare products on a soft editorial beauty flatlay"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 55vw, 34vw"
              />
            </div>
            <div className="absolute right-0 top-0 h-[58%] w-[55%] overflow-hidden rounded-[42px] bg-white shadow-[0_30px_95px_-70px_rgba(26,21,18,0.48)] ring-1 ring-white/90 sm:rounded-[54px] lg:h-[66%]">
              <Image
                src={IMAGES.hero.primary}
                alt="Editorial makeup and skincare campaign photography"
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 55vw, 34vw"
              />
            </div>
            <div className="absolute bottom-3 left-1/2 w-[92%] -translate-x-1/2 rounded-[32px] border border-white/90 bg-white p-3 shadow-[0_30px_100px_-64px_rgba(26,21,18,0.55)] sm:rounded-[40px] sm:p-4 lg:bottom-8 lg:w-[78%]">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {heroProducts.map((product) => (
                  <Link
                    key={product.name}
                    href={product.href}
                    className="group rounded-[24px] bg-[#fbf6f2] p-2 transition hover:bg-[#f6e2f4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7a377f] focus-visible:ring-offset-2 sm:rounded-[30px]"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-[18px] bg-white sm:rounded-[24px]">
                      <Image
                        src={product.image}
                        alt={`${product.brand} ${product.name}`}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-[1.04]"
                        sizes="180px"
                      />
                    </div>
                    <p className="mt-2 hidden text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7a377f] sm:block">{product.brand}</p>
                    <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-4 text-neutral-700 sm:text-[11px]">{product.name}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="absolute right-4 top-[54%] hidden rounded-full bg-neutral-950 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_18px_50px_-34px_rgba(26,21,18,0.7)] sm:block">
              Fresh beauty shelf
            </div>
          </div>
        </div>
      </div>
      <div className="h-12 rounded-t-[55%] bg-[#fffaf7] md:h-16" aria-hidden="true" />
    </section>
  );
}
