import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/image-library";

export function BrandPhilosophyBanner() {
  return (
    <section className="bg-brand-surfaceLime">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[38px] bg-neutral-100 shadow-editorial lg:aspect-[5/6]">
          <Image src={IMAGES.editorial.brandMission} alt="Woman applying skincare in an editorial beauty ritual" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" />
        </div>
        <div className="lg:pl-8">
          <p className="type-label text-primary">Our point of view</p>
          <h2 className="mt-4 font-display text-5xl font-light leading-[0.98] tracking-[-0.02em] text-neutral-900 md:text-7xl">
            Premium should feel personal.
          </h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-neutral-600 md:text-lg">
            GLAMO Nepal curates beauty for real routines: humid commutes, festival evenings, college mornings, office days and gifting moments across Nepal.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            <div className="border-t border-neutral-300 pt-4">
              <p className="font-display text-4xl text-primary">01</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Authentic-first product selection.</p>
            </div>
            <div className="border-t border-neutral-300 pt-4">
              <p className="font-display text-4xl text-primary">02</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Nepal-aware delivery and support.</p>
            </div>
            <div className="border-t border-neutral-300 pt-4">
              <p className="font-display text-4xl text-primary">03</p>
              <p className="mt-2 text-sm leading-6 text-neutral-600">Clear routines over noisy trends.</p>
            </div>
          </div>
          <Link href="/about" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-neutral-900 px-8 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-primary">
            Read our story
          </Link>
        </div>
      </div>
    </section>
  );
}
