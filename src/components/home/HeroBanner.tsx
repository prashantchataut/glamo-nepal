import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/image-library";

const trustItems = [
  "Authenticity-first beauty curation",
  "Kathmandu store support",
  "Nepal-wide delivery",
];

export function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-[#fbf7f3]">
      <div className="mx-auto grid min-h-[calc(100svh-108px)] max-w-[1500px] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="order-2 flex items-center px-5 py-12 sm:px-8 md:py-16 lg:order-1 lg:px-12 xl:px-16">
          <div className="max-w-xl">
            <p className="type-label text-primary">GLAMO Nepal</p>
            <h1 className="mt-5 font-display text-5xl font-light leading-[0.92] tracking-[-0.03em] text-neutral-900 sm:text-6xl md:text-7xl xl:text-8xl">
              Beauty that feels considered.
            </h1>
            <p className="mt-6 max-w-md text-base leading-8 text-neutral-600 md:text-lg">
              Editorial skincare, makeup and body care selected for Nepal — polished, authentic, and easy to shop in रू.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className="inline-flex min-h-12 items-center justify-center bg-neutral-900 px-8 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-primary">
                Shop the edit
              </Link>
              <Link href="/brands" className="inline-flex min-h-12 items-center justify-center border border-neutral-300 bg-white px-8 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900 transition-colors hover:border-primary hover:text-primary">
                Explore brands
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-3 border-y border-neutral-200 py-5">
              <div>
                <dt className="font-display text-2xl text-primary">77</dt>
                <dd className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">District reach</dd>
              </div>
              <div>
                <dt className="font-display text-2xl text-primary">100%</dt>
                <dd className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">Curated catalog</dd>
              </div>
              <div>
                <dt className="font-display text-2xl text-primary">+977</dt>
                <dd className="mt-1 text-[10px] uppercase tracking-[0.16em] text-neutral-500">Local support</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="order-1 relative min-h-[56svh] overflow-hidden lg:order-2 lg:min-h-[calc(100svh-108px)]">
          <Image
            src={IMAGES.hero.primary}
            alt="Editorial beauty portrait for GLAMO Nepal"
            fill
            priority
            className="hidden object-cover object-center md:block"
            sizes="(max-width: 1024px) 100vw, 56vw"
          />
          <Image
            src={IMAGES.hero.mobile}
            alt="Close-up beauty portrait for GLAMO Nepal"
            fill
            priority
            className="object-cover object-center md:hidden"
            sizes="100vw"
          />
          <div className="absolute inset-x-4 bottom-4 bg-white/92 p-4 shadow-editorial md:inset-x-auto md:bottom-8 md:left-8 md:max-w-xs md:p-5">
            <p className="type-label text-primary">This week</p>
            <p className="mt-2 font-display text-2xl leading-tight text-neutral-900">Soft glam, barrier care and everyday sunscreen rituals.</p>
          </div>
        </div>
      </div>

      <div className="border-y border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-7xl divide-y divide-neutral-200 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8">
          {trustItems.map((item) => (
            <p key={item} className="py-4 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
              {item}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
