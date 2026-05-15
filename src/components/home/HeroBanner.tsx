import Link from "next/link";
import Image from "next/image";

export function HeroBanner() {
  return (
    <section className="relative" style={{ minHeight: "calc(100vh - var(--navbar-height) - var(--bar-height))" }}>
      {/* Mobile: Image first */}
      <div className="relative h-[50vh] lg:hidden">
        <Image
          src="/images/editorial/hero-editorial.svg"
          alt="GLAMO Nepal premium beauty products"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>

      <div className="grid h-full lg:min-h-[calc(100vh-var(--navbar-height)-var(--bar-height))] lg:grid-cols-[55fr_45fr]">
        {/* Left: Text content */}
        <div className="flex items-center bg-primary-dark px-6 py-16 lg:px-16 lg:py-0">
          <div className="mx-auto max-w-xl text-white">
            <h1 className="type-display-xl italic">
              Premium Beauty,<br />
              Thoughtfully Curated
            </h1>
            <p className="type-body-lg mt-6 text-white/80 max-w-md">
              Authentic skincare, makeup, and personal care essentials — curated for Nepal.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center bg-white px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-primary-dark transition-colors duration-200 hover:bg-neutral-100 cursor-pointer"
              >
                Shop Now
              </Link>
              <Link
                href="/brands"
                className="inline-flex items-center justify-center border border-white/40 px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-white transition-colors duration-200 hover:bg-white/10 cursor-pointer"
              >
                Explore Brands
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Image (desktop only) */}
        <div className="relative hidden lg:block">
          <Image
            src="/images/editorial/hero-editorial.svg"
            alt="GLAMO Nepal premium beauty products"
            fill
            priority
            className="object-cover object-center"
            sizes="45vw"
          />
        </div>
      </div>

      {/* Trust badges */}
      <div className="bg-primary-dark border-t border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-4 py-4 md:gap-12 md:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-white/70">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" /><path d="M12 5v14" /><rect x="2" y="2" width="20" height="20" rx="5" />
            </svg>
            <span className="type-label text-[10px] text-white/90">Free Shipping Over रू 2,000</span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="type-label text-[10px] text-white/90">Authentic Products Only</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-white/90">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" /><path d="M9 12l2 2 4-4" />
            </svg>
            <span className="type-label text-[10px] text-white/90">7-Day Returns</span>
          </div>
        </div>
      </div>
    </section>
  );
}