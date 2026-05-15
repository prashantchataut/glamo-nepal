import Link from "next/link";

export function BrandPhilosophyBanner() {
  return (
    <section className="bg-neutral-100">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24 lg:px-8 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left: Quote */}
          <div>
            <blockquote className="type-display-lg italic text-neutral-900">
              &ldquo;Premium beauty, thoughtfully curated for Nepal.&rdquo;
            </blockquote>
            <p className="type-body-md mt-6 text-neutral-400 max-w-md">
              We believe beauty should be accessible, authentic, and tailored to
              the unique needs of Nepali skin and lifestyle.
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium tracking-[0.1em] uppercase text-neutral-700 relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-secondary after:transition-all after:duration-300"
            >
              Our Story
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          {/* Right: Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center lg:text-left">
              <p className="type-display-lg text-primary">200+</p>
              <p className="type-label text-neutral-400 mt-2">Brands</p>
            </div>
            <div className="text-center lg:text-left">
              <p className="type-display-lg text-primary">3000+</p>
              <p className="type-label text-neutral-400 mt-2">Products</p>
            </div>
            <div className="text-center lg:text-left">
              <p className="type-display-lg text-primary">100%</p>
              <p className="type-label text-neutral-400 mt-2">Authentic</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}