import { MapPinned, Plus } from "lucide-react";
import Link from "next/link";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Saved Addresses", description: "Manage GLAMO Nepal delivery addresses and default shipping locations.", path: "/account/addresses", noIndex: true });

export default function AddressesPage() {
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="type-label text-primary">Addresses</p>
          <h1 className="mt-3 font-display text-4xl font-medium text-neutral-900 md:text-5xl">Saved delivery addresses</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">Keep Nepal delivery details ready for faster checkout. Address editing will connect to Supabase profile data when enabled.</p>
        </div>
        <Link href="/checkout" className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"><Plus size={16} /> Add address at checkout</Link>
      </div>
      <div className="mt-8 border border-primary/20 bg-primary/5 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center bg-primary/10 text-primary"><MapPinned size={24} /></div>
        <p className="mt-4 font-display text-xl font-semibold text-neutral-900">No saved addresses yet</p>
        <p className="mt-2 text-sm leading-7 text-neutral-600">You can add delivery addresses during checkout. Your addresses will appear here once you place an order.</p>
        <Link href="/shop" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark">Browse products &rarr;</Link>
      </div>
    </div>
  );
}
