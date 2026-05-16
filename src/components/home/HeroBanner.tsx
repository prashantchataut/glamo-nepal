
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Sparkles } from "lucide-react";
import { IMAGES } from "@/lib/image-library";

const productTiles = [
  { name: "COSRX Snail Essence", image: IMAGES.heroProducts.cosrx },
  { name: "Cetaphil Cleanser", image: IMAGES.heroProducts.cetaphil },
  { name: "Maybelline Fit Me", image: IMAGES.heroProducts.maybelline },
];

const trustItems = [
  { label: "Authenticity checked", icon: ShieldCheck },
  { label: "Nepal-wide delivery", icon: Truck },
  { label: "Real brand edit", icon: Sparkles },
];

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-[#f5e5f6]">
      <div className="absolute inset-x-0 bottom-[-1px] h-16 rounded-t-[55%] bg-[#fffaf7]" aria-hidden="true" />
      <div className="mx-auto grid max-w-[1500px] gap-8 px-5 pb-24 pt-9 sm:px-8 lg:min-h-[640px] lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-10 lg:pt-8">
        <div className="relative z-10 max-w-[600px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Premium beauty for Nepal</p>
          <h1 className="mt-4 font-display text-[4.4rem] font-semibold leading-[0.82] tracking-[-0.065em] text-neutral-950 sm:text-[6.2rem] lg:text-[7.4rem]">
            Clean beauty, carefully edited.
          </h1>
          <p className="mt-6 max-w-md text-sm leading-7 text-neutral-700 sm:text-base">
            A calmer storefront for skincare, soft glam and daily SPF — real brands, real routines and a more editorial GLAMO Nepal point of view.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/shop" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-neutral-950 px-8 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-primary">View all products <ArrowRight size={15} /></Link>
            <Link href="/brands" className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-950/15 bg-white/70 px-8 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-950 transition-colors hover:border-primary hover:text-primary">Shop brands</Link>
          </div>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            {trustItems.map(({ label, icon: Icon }) => (
              <div key={label} className="rounded-2xl bg-white/65 p-3 ring-1 ring-white/80"><Icon size={16} className="mb-2 text-primary" aria-hidden="true" /><span className="block text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-neutral-700">{label}</span></div>
            ))}
          </div>
        </div>
        <div className="relative z-10 min-h-[420px] lg:min-h-[560px]">
          <div className="absolute right-0 top-3 hidden h-[420px] w-[70%] overflow-hidden rounded-[42px] bg-white/45 ring-1 ring-white/70 md:block">
            <Image src={IMAGES.hero.primary} alt="Editorial clean beauty campaign image" fill priority className="object-cover object-center opacity-95" sizes="(max-width: 1024px) 70vw, 42vw" />
          </div>
          <div className="absolute left-0 top-0 h-[340px] w-[62%] overflow-hidden rounded-[42px] bg-[#f9f4ef] shadow-editorial ring-1 ring-white/80 md:h-[470px] md:w-[52%]">
            <Image src={IMAGES.hero.flatlay} alt="Skincare products on a soft beauty flatlay" fill priority className="object-cover" sizes="(max-width: 1024px) 65vw, 34vw" />
          </div>
          <div className="absolute bottom-0 right-0 grid w-[86%] grid-cols-3 gap-3 rounded-[32px] bg-white/88 p-3 shadow-editorial ring-1 ring-white md:w-[68%]">
            {productTiles.map((tile) => (
              <div key={tile.name} className="overflow-hidden rounded-[24px] bg-[#fbf7f3]">
                <div className="relative aspect-square"><Image src={tile.image} alt={tile.name} fill className="object-cover" sizes="180px" /></div>
                <p className="px-3 py-2 text-[10px] font-semibold leading-4 text-neutral-700">{tile.name}</p>
              </div>
            ))}
          </div>
          <div className="absolute right-4 top-7 rounded-full bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-950 shadow-soft">Kathmandu ready</div>
        </div>
      </div>
    </section>
  );
}
