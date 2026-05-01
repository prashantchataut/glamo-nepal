import Image from "next/image";
import Link from "next/link";

export function NewYearOfferBanner() {
  return (
    <section className="bg-brand-bgLight py-14 md:py-20">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <div className="relative overflow-hidden rounded-[2.25rem] border border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_55%,#F7F1EA_100%)] px-6 py-8 shadow-[0_30px_90px_-65px_rgba(36,31,34,0.45)] md:px-10 md:py-12 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
          <div className="pointer-events-none absolute right-[-10%] top-[-20%] h-72 w-72 rounded-full bg-brand-secondary/35 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex rounded-full bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-brand-primary ring-1 ring-brand-primary/10">New Year 2083 Beauty Edit</span>
            <h2 className="mt-5 font-serif text-4xl font-semibold leading-[0.95] text-brand-textPrimary md:text-5xl lg:text-6xl">Celebrate with a <span className="italic text-brand-primary">fresh beauty edit</span></h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-brand-textMuted md:text-base">Gift-ready skincare, soft glam makeup and daily glow essentials curated for celebrations across Nepal.</p>
            <div className="mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-white px-5 py-4 shadow-sm ring-1 ring-brand-border"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary">Save up to</p><p className="mt-1 font-serif text-3xl font-semibold text-brand-textPrimary">30% OFF</p></div>
              <div className="rounded-[1.5rem] bg-white/70 px-5 py-4 shadow-sm ring-1 ring-brand-border"><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-primary">Highlights</p><p className="mt-1 text-sm text-brand-textMuted">Gift sets · Best sellers · New arrivals</p></div>
            </div>
            <div className="mt-7 flex flex-wrap gap-3"><Link href="/collections/festival-ready" className="rounded-full bg-brand-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-primary-hover">Shop New Year Offers</Link><Link href="/collections/new-arrivals" className="rounded-full border border-brand-primary/20 bg-white/70 px-6 py-3 text-sm font-bold text-brand-primary transition hover:bg-white">Explore new arrivals</Link></div>
          </div>
          <div className="relative z-10 mt-8 lg:mt-0"><div className="relative mx-auto aspect-[4/3] max-w-[560px] overflow-hidden rounded-[2rem] border border-white/70 bg-white p-3 shadow-[0_30px_90px_-55px_rgba(36,31,34,0.45)]"><div className="relative h-full w-full overflow-hidden rounded-[1.5rem]"><Image src="/images/editorial/new-year-editorial.svg" alt="GLAMO New Year 2083 beauty offer" fill className="object-cover" sizes="(max-width: 1024px) 90vw, 40vw" /></div></div></div>
        </div>
      </div>
    </section>
  );
}
