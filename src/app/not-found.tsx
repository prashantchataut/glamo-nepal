import Link from "next/link";
import { ArrowRight, Home, Search, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-[72vh] bg-brand-bgLight py-16 md:py-20">
      <div className="container mx-auto max-w-3xl px-4 text-center md:px-6">
        <div className="rounded-[2rem] border border-border/70 bg-white p-8 shadow-sm md:p-12">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand-gold">404 · GLAMO NEPAL</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight text-brand-textPrimary md:text-7xl">This glow is out of stock</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-brand-textMuted md:text-base">The page you are looking for may have moved, sold out, or never existed. Continue shopping or search for skincare, SPF, lip tint or Made in Nepal picks.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-7 py-3 font-semibold text-white transition hover:bg-brand-bgDark"><ShoppingBag size={17} /> Shop GLAMO</Link>
            <Link href="/search" className="inline-flex items-center gap-2 rounded-full border border-brand-primary px-7 py-3 font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"><Search size={17} /> Search</Link>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3 font-semibold text-brand-textMuted transition hover:border-brand-primary hover:text-brand-primary"><Home size={17} /> Home <ArrowRight size={16} /></Link>
          </div>
        </div>
      </div>
    </main>
  );
}
