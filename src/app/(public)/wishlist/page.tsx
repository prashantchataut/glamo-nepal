import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Wishlist",
  description: "Save your favourite GLAMO Nepal beauty products and return to them later.",
  path: "/wishlist",
});

export default function WishlistLandingPage() {
  return (
    <main className="bg-cream-50 px-4 py-14 md:py-24">
      <div className="mx-auto max-w-5xl rounded-2xl bg-brand-blush p-5 md:p-10">
        <div className="grid gap-8 rounded-2xl bg-cream-50 p-7 shadow-editorial md:grid-cols-[0.9fr_1.1fr] md:items-center md:p-10">
          <div className="relative min-h-[250px] overflow-hidden rounded-2xl bg-cream-100">
            <div className="absolute left-8 top-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-cream-50 text-brand-rose shadow-soft">
              <Heart size={30} strokeWidth={1.5} />
            </div>
            <div className="absolute bottom-8 left-8 right-8 rounded-2xl bg-ink p-5 text-white">
              <Sparkles size={18} className="text-brand-blush" />
              <p className="mt-3 font-display text-3xl font-semibold leading-none">Saved shelf</p>
              <p className="mt-2 text-xs leading-5 text-white/70">Keep skincare, SPF and makeup picks ready for checkout.</p>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-rose">Wishlist</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-none tracking-[-0.05em] text-ink md:text-7xl">Your quiet beauty shortlist.</h1>
            <p className="mt-5 max-w-xl text-sm leading-8 text-cream-700">Create an account or sign in to sync favourites, routine ideas and product saves across visits.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/account/wishlist" className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-8 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-brand-rose">Open wishlist</Link>
              <Link href="/shop" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-neutral-950/15 px-8 text-xs font-semibold uppercase tracking-[0.18em] text-ink transition hover:border-brand-rose hover:text-brand-rose">Browse products</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
