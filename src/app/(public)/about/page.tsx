import Image from "next/image";
import Link from "next/link";
import { EditorialHero, EditorialSection, InfoCard } from "@/components/common/EditorialPage";
import { IMAGES } from "@/lib/image-library";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "About GLAMO Nepal",
  description: "Meet GLAMO Nepal, a premium beauty destination curating authentic skincare, makeup and self-care for Nepal.",
  path: "/about",
});

const values = [
  ["Authenticity first", "We curate products with clear sourcing, transparent product information and no confusing beauty hype."],
  ["Made for Nepal", "Our edits consider Kathmandu dust, Pokhara humidity, harsh sun, festival calendars and everyday routines."],
  ["Premium, approachable", "Luxury should feel calm, helpful and accessible, not intimidating or overloaded."],
];

export default function AboutPage() {
  return (
    <main className="bg-neutral-50 pb-20 md:pb-0">
      <EditorialHero
        eyebrow="Our story"
        title="Beauty curated with Nepal in mind."
        description="GLAMO Nepal exists for shoppers who want premium skincare, soft-glam makeup and practical guidance without guesswork. Every edit is designed to feel elevated, trustworthy and easy to shop."
        image={IMAGES.editorial.about}
        imageAlt="Editorial beauty studio for GLAMO Nepal"
        cta={{ label: "Shop the edit", href: "/shop" }}
      />

      <EditorialSection eyebrow="Point of view" title="A calmer way to shop beauty." description="The beauty world can be noisy. GLAMO keeps the experience focused: useful categories, honest routines, real delivery expectations and product pages that help customers make confident decisions.">
        <div className="grid gap-4 md:grid-cols-3">
          {values.map(([title, body]) => <InfoCard key={title} title={title} body={body} />)}
        </div>
      </EditorialSection>

      <section className="bg-white py-12 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
          <div className="relative aspect-[4/5] overflow-hidden border border-neutral-200 bg-neutral-100">
            <Image src={IMAGES.editorial.brandMission} alt="Applying skincare as part of a calm routine" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
          </div>
          <div>
            <p className="type-label text-primary">Mission</p>
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight text-neutral-900 md:text-6xl">Make premium beauty feel personal, local and shoppable.</h2>
            <p className="mt-6 text-base leading-8 text-neutral-600">From sunscreen that works in Nepal&apos;s sun to lip tints that fit daily and festival looks, GLAMO builds a beauty destination around real customer moments.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {["44+ curated SKUs", "77 districts considered", "NPR-first pricing"].map((stat) => <div key={stat} className="border border-neutral-200 bg-neutral-50 p-4 text-sm font-semibold text-neutral-900">{stat}</div>)}
            </div>
            <Link href="/contact" className="mt-8 inline-flex min-h-11 items-center justify-center border border-neutral-900 px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-white">Talk to us</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
