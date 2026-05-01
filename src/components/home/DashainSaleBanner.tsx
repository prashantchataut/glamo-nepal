import Image from "next/image";
import Link from "next/link";

export function DashainSaleBanner() {
  return (
    <section className="bg-[#FBF7F8] py-8 md:py-10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#521c40] via-[#8b3a8f] to-[#d4779c] px-6 py-8 text-white shadow-[0_30px_90px_-45px_rgba(82,28,64,0.65)] md:px-10 md:py-10 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,224,184,0.16),transparent_20%)]" />
          <div className="absolute right-[-10%] top-[-20%] h-56 w-56 rounded-full border border-white/15" />
          <div className="absolute bottom-[-18%] left-[35%] h-48 w-48 rounded-full border border-white/10" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex rounded-full bg-white/16 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90 ring-1 ring-white/20">
              New Year 2083 Special Offer
            </span>
            <h2 className="mt-5 font-serif text-4xl font-semibold leading-[0.95] md:text-5xl lg:text-6xl">
              Celebrate the <span className="italic text-[#F7D799]">new year</span>
              <span className="mt-2 block">with a fresh beauty edit</span>
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-base">
              Discover glow-worthy skincare, statement lip shades and giftable beauty favorites curated for festive days and polished everyday moments.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-[1.5rem] bg-white px-5 py-4 text-brand-bgDark shadow-lg">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary">Save up to</p>
                <p className="mt-1 font-serif text-3xl font-semibold">30% OFF</p>
              </div>
              <div className="rounded-[1.5rem] border border-white/20 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">Offer highlights</p>
                <p className="mt-1 text-sm text-white/90">Gift-ready sets · Best sellers · New arrivals</p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/collections/festival-ready" className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-primary transition hover:bg-[#FCEED7]">
                Shop New Year Offers
              </Link>
              <Link href="/collections/new-arrivals" className="rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/18">
                Explore new arrivals
              </Link>
            </div>
          </div>

          <div className="relative z-10 mt-8 lg:mt-0">
            <div className="relative mx-auto flex max-w-[430px] items-end justify-center">
              <div className="absolute left-0 top-10 h-24 w-24 rounded-full bg-[#F7D799]/30 blur-2xl" />
              <div className="absolute right-0 top-0 rounded-full bg-[#F7D799] px-5 py-4 text-center text-brand-bgDark shadow-xl">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em]">Limited time</p>
                <p className="font-serif text-3xl font-semibold leading-none">2083</p>
              </div>
              <div className="relative h-[340px] w-[260px] overflow-hidden rounded-[2rem] border border-white/20 bg-white/12 p-3 shadow-2xl backdrop-blur">
                <div className="relative h-full w-full overflow-hidden rounded-[1.5rem] bg-[#f7d7df]">
                  <Image src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80" alt="GLAMO New Year 2083 beauty offer" fill className="object-cover" sizes="(max-width: 1024px) 80vw, 30vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#521c40]/20 via-transparent to-white/10" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
