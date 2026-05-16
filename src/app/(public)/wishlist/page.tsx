import Link from "next/link";
import { Heart } from "lucide-react";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Wishlist", description: "Save your favourite GLAMO Nepal beauty products and return to them later.", path: "/wishlist" });

export default function WishlistLandingPage() {
  return (
    <main className="bg-neutral-50 py-12 md:py-20">
      <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center border border-neutral-200 bg-white text-primary"><Heart size={30} strokeWidth={1.5} /></div>
        <p className="type-label mt-8 text-primary">Saved beauty shelf</p>
        <h1 className="mt-4 font-display text-5xl font-medium leading-tight text-neutral-900 md:text-6xl">Your wishlist lives in your account.</h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-neutral-600">Create an account or sign in to sync favourites, routine ideas and product saves across visits.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/account/wishlist" className="inline-flex min-h-11 items-center justify-center bg-primary px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-primary-dark">Open wishlist</Link>
          <Link href="/shop" className="inline-flex min-h-11 items-center justify-center border border-neutral-900 px-8 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-900 hover:bg-neutral-900 hover:text-white">Browse products</Link>
        </div>
      </div>
    </main>
  );
}
