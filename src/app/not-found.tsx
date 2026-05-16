import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[72vh] bg-cream-50 px-4 py-20 md:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-display text-[7rem] font-light leading-none tracking-[-0.06em] text-cream-200 md:text-[10rem]">404</p>
        <h1 className="-mt-5 font-display text-display-md font-light text-ink md:-mt-8">Page not found.</h1>
        <p className="mx-auto mt-5 max-w-lg text-body-md leading-8 text-cream-700">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Return home or browse the GLAMO edit.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/" className="inline-flex min-h-14 items-center justify-center bg-ink px-8 text-label-md font-semibold uppercase tracking-[0.12em] text-cream-50 transition hover:bg-brand-deep">
            Go home
          </Link>
          <Link href="/shop" className="inline-flex min-h-14 items-center justify-center border border-ink/20 px-8 text-label-md font-semibold uppercase tracking-[0.12em] text-ink transition hover:border-brand-rose hover:text-brand-rose">
            Browse products
          </Link>
        </div>
      </div>
    </main>
  );
}
