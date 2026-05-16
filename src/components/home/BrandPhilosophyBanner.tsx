import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { IMAGES } from "@/lib/image-library";

const stats = [
  { value: "77", label: "district-aware delivery" },
  { value: "100%", label: "authentic catalog" },
  { value: "4", label: "core rituals" },
];

export function BrandPhilosophyBanner() {
  return (
    <section className="overflow-hidden bg-brand-blush/70 py-20 md:py-28 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-4 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="relative order-2 lg:order-1">
          <div className="absolute -left-8 -top-8 hidden h-64 w-64 rounded-[55%_45%_60%_40%] bg-cream-50/70 md:block" aria-hidden="true" />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[48%_52%_44%_56%/54%_45%_55%_46%] bg-cream-100 shadow-editorial md:aspect-[5/6]">
            <Image src={IMAGES.editorial.brandMission} alt="Woman applying skincare in an editorial beauty ritual" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 48vw" />
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:pl-8">
          <div className="grid gap-6 md:grid-cols-[0.28fr_0.72fr]">
            <p className="type-label text-brand-deep">Our point of view</p>
            <div>
              <h2 className="text-balance font-display text-display-lg font-light leading-[0.98] tracking-[-0.04em] text-ink">
                Premium should feel personal.
              </h2>
              <p className="mt-6 max-w-2xl text-pretty text-body-md leading-8 text-cream-700 md:text-body-lg">
                GLAMO Nepal curates beauty for real routines: humid commutes, festival evenings, college mornings, office days and gifting moments across Nepal.
              </p>
              <Link href="/about" className="mt-8 inline-flex min-h-12 items-center gap-3 border border-ink/20 px-6 text-label-md font-semibold uppercase tracking-[0.14em] text-ink transition hover:border-brand-rose hover:text-brand-deep">
                Our philosophy <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-px bg-cream-300 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="bg-brand-blush/90 p-5 sm:p-6">
                <p className="font-display text-[clamp(3rem,9vw,5rem)] font-light leading-none tracking-[-0.06em] text-brand-dark">{item.value}</p>
                <p className="mt-3 max-w-[9rem] text-label-sm font-semibold uppercase tracking-[0.15em] text-cream-700">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
