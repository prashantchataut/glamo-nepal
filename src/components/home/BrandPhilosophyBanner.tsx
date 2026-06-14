import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@/lib/image-library";

export function BrandPhilosophyBanner() {
  return (
    <section className="bg-brand-surfaceLime">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-8">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] bg-neutral-100 shadow-editorial lg:aspect-[5/6]">
          <Image src={IMAGES.editorial.brandMission} alt="Woman applying skincare in an editorial beauty ritual" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" />
        </div>
        <div className="lg:pl-8">
          <h2 className="type-display-md font-medium tracking-[-0.02em] text-neutral-900 md:type-display-lg">
            Premium should feel personal.
          </h2>
          <p className="mt-6 max-w-xl text-sm leading-7 text-neutral-600 md:text-base md:leading-8">
            GLAMO Nepal curates beauty for real routines: humid commutes, festival evenings, college mornings, office days and gifting moments in Kathmandu.
          </p>
          <div className="mt-10 space-y-5">
            <div className="rounded-lg bg-primary/5 p-4">
              <p className="font-display text-base font-semibold text-neutral-900 md:text-lg">Authentic-first selection</p>
              <p className="mt-1 text-sm leading-6 text-neutral-500">Every product verified for authenticity before it reaches you.</p>
            </div>
            <div className="rounded-lg bg-secondary/5 p-4">
              <p className="font-display text-base font-semibold text-neutral-900 md:text-lg">Kathmandu Valley delivery</p>
              <p className="mt-1 text-sm leading-6 text-neutral-500">Realistic timelines, local support, and transparent tracking.</p>
            </div>
            <div className="rounded-lg bg-neutral-100 p-4">
              <p className="font-display text-base font-semibold text-neutral-900 md:text-lg">Clear routines over noisy trends</p>
              <p className="mt-1 text-sm leading-6 text-neutral-500">Guided product picks, not overwhelming choice.</p>
            </div>
          </div>
          <Link href="/about" className="mt-10 inline-flex min-h-12 items-center justify-center rounded-full bg-neutral-900 px-8 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-primary">
            Read our story
          </Link>
        </div>
      </div>
    </section>
  );
}
