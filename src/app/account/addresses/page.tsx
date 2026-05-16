import { Home, MapPinned, Plus, Star } from "lucide-react";
import { SAMPLE_ADDRESSES } from "@/lib/data/users";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Saved Addresses", description: "Manage GLAMO Nepal delivery addresses and default shipping locations.", path: "/account/addresses", noIndex: true });

export default function AddressesPage() {
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="type-label text-brand-rose">Addresses</p>
          <h1 className="mt-3 font-display text-4xl font-medium text-ink md:text-5xl">Saved delivery addresses</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-cream-700">Keep Nepal delivery details ready for faster checkout. Address editing will connect to Supabase profile data when enabled.</p>
        </div>
        <button disabled className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-2 bg-brand-rose/50 px-6 py-3 text-sm font-semibold text-white"><Plus size={16} /> Add address</button>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {SAMPLE_ADDRESSES.map((address) => (
          <article key={address.id} className="border border-cream-200 bg-cream-50 p-6 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center bg-brand-rose/10 text-brand-rose">{address.label.toLowerCase().includes("home") ? <Home size={20} /> : <MapPinned size={20} />}</div>
                <div><h2 className="font-display text-2xl font-medium text-ink">{address.label}</h2><p className="text-sm text-cream-400">{address.fullName}</p></div>
              </div>
              {address.isDefault ? <span className="inline-flex items-center gap-1 bg-brand-rose px-3 py-1 text-xs font-semibold text-white"><Star size={12} /> Default</span> : null}
            </div>
            <div className="mt-5 space-y-1 text-sm leading-6 text-cream-700"><p>{address.phone}</p><p>{address.addressLine1}</p><p>{address.city}, {address.district}, {address.province}</p></div>
            <div className="mt-6 flex flex-wrap gap-3"><button disabled className="min-h-11 cursor-not-allowed border border-cream-200 px-5 py-2 text-sm font-semibold text-cream-400">Edit soon</button>{!address.isDefault ? <button disabled className="min-h-11 cursor-not-allowed border border-cream-200 px-5 py-2 text-sm font-semibold text-cream-400">Make default soon</button> : null}</div>
          </article>
        ))}
      </div>
      <div className="mt-8 border border-brand-rose/20 bg-brand-rose/5 p-6 text-center"><p className="text-sm leading-7 text-cream-700">For now, enter final delivery details at checkout. Need urgent help? Message GLAMO on WhatsApp.</p></div>
    </div>
  );
}
