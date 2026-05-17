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
    <main className="bg-[#fffaf7] px-4 py-14 md:py-24">
      <div className="mx-auto max-w-5xl rounded-[2.75rem] bg-[#f6e6f4] p-5 md:p-10">
        <div className="grid gap-8 rounded-[2.25rem] bg-white p-7 shadow-editorial md:grid-cols-[0.9fr_1.1fr] md:items-center md:p-10">
          <div className="relative min-h-[250px] overflow-hidden rounded-[2rem] bg-[#fff7f3]">
            <div className="absolute left-8 top-8 flex h-20 w-20 items-center justify-center rounded-full bg-white text-primary shadow-soft">
              <Heart size={30} strokeWidth={1.5} />
            </div>
            <div className="absolute bottom-8 left-8 right-8 rounded-[1.5rem] bg-neutral-950 p-5 text-white">
              <Sparkles size={18} className="text-[#f0d3f3]" />
              <p className="mt-3 font-display text-3xl font-semibold leading-none">Saved shelf</p>
              <p className="mt-2 text-xs leading-5 text-white/70">Keep skincare, SPF and makeup picks ready for checkout.</p>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Wishlist</p>
            <h1 className="mt-3 font-display text-5xl font-semibold leading-none tracking-[-0.05em] text-neutral-950 md:text-7xl">Your quiet beauty shortlist.</h1>
            <p className="mt-5 max-w-xl text-sm leading-8 text-neutral-600">Create an account or sign in to sync favourites, routine ideas and product saves across visits.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/account/wishlist" className="inline-flex min-h-12 items-center justify-center rounded-full bg-neutral-950 px-8 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-primary">Open wishlist</Link>
              <Link href="/shop" className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-950/15 px-8 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-950 transition hover:border-primary hover:text-primary">Browse products</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
