import Link from "next/link";
import { ShoppingBag, Search, Home, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] bg-neutral-50 py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <p className="type-display-xl text-neutral-200 font-light">404</p>
        <h1 className="type-display-lg text-neutral-900 -mt-4 italic">
          Page not found
        </h1>
        <p className="type-body-md text-neutral-500 mt-4 max-w-md mx-auto">
          The page you&apos;re looking for may have moved, sold out, or never existed. Continue shopping or search for what you need.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-primary px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-neutral-50 transition-colors hover:bg-primary-dark cursor-pointer"
          >
            <ShoppingBag size={16} /> Shop GLAMO
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 border border-neutral-200 px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-neutral-700 transition-colors hover:border-neutral-400 cursor-pointer"
          >
            <Search size={16} /> Search
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-neutral-200 px-8 py-3 text-[13px] font-medium tracking-[0.1em] uppercase text-neutral-700 transition-colors hover:border-neutral-400 cursor-pointer"
          >
            <Home size={16} /> Home <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}