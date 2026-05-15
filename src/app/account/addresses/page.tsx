// TODO: Add auth guard redirect when Supabase auth is connected
// Example: if (!user) redirect('/login')
import { Home, MapPinned, Plus, Star } from "lucide-react";
import { SAMPLE_ADDRESSES as SAMPLE_ADDRESSES } from "@/lib/data/users";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Saved Addresses",
  description: "Manage GLAMO NEPAL delivery addresses and default shipping locations.",
  path: "/account/addresses",
  noIndex: true,
});

export default function AddressesPage() {
  return (
    <div>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[0.22em] text-brand-gold">Addresses</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-brand-textPrimary md:text-5xl">Saved delivery addresses</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-textMuted">Save Nepal delivery details for faster checkout.</p>
        </div>
        <button disabled className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-full bg-brand-primary/50 px-6 py-3 text-sm font-semibold text-white/80"><Plus size={16} /> Add address <span className="font-label rounded-full bg-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider">Coming soon</span></button>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {SAMPLE_ADDRESSES.map((address) => (
          <article key={address.id} className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                  {address.label.toLowerCase().includes("home") ? <Home size={19} /> : <MapPinned size={19} />}
                </div>
                <div>
                  <h2 className="font-display text-2xl font-semibold text-brand-textPrimary">{address.label}</h2>
                  <p className="text-sm text-brand-textMuted">{address.name}</p>
                </div>
              </div>
              {address.isDefault ? <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white"><Star size={12} /> Default</span> : null}
            </div>
            <div className="mt-5 space-y-1 text-sm leading-6 text-brand-textMuted">
              <p>{address.phone}</p>
              <p>{address.address}</p>
              <p>{address.city}, {address.district}, {address.province}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button disabled className="cursor-not-allowed rounded-full border border-brand-primary/40 px-5 py-2 text-sm font-semibold text-brand-primary/50">Edit <span className="font-label text-[10px] uppercase tracking-wider">Soon</span></button>
              {!address.isDefault ? <button disabled className="cursor-not-allowed rounded-full border border-border px-5 py-2 text-sm font-semibold text-brand-textMuted/50">Make default <span className="font-label text-[10px] uppercase tracking-wider">Soon</span></button> : null}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 rounded-[2rem] border border-brand-primary/20 bg-brand-primary/5 p-6 text-center">
        <p className="text-sm text-brand-textMuted">Address management is coming soon. For now, you can enter delivery details at checkout. <span className="font-semibold text-brand-primary">Need help? Message us on WhatsApp.</span></p>
      </div>
    </div>
  );
}