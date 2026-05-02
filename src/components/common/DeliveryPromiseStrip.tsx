import { Clock3, MapPin, PackageCheck, ShieldCheck } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

const promises = [
  { icon: <Clock3 className="h-5 w-5" aria-hidden="true" />, title: "Fast Valley delivery", body: "Kathmandu Valley orders usually arrive within 1–2 business days." },
  { icon: <MapPin className="h-5 w-5" aria-hidden="true" />, title: "Visit our store", body: SITE_CONFIG.address },
  { icon: <PackageCheck className="h-5 w-5" aria-hidden="true" />, title: "Thoughtful gifting", body: "Gift-ready picks, easy checkout and festival-friendly shopping." },
  { icon: <ShieldCheck className="h-5 w-5" aria-hidden="true" />, title: "Authenticity first", body: "Curated beauty with supplier-backed sourcing and careful product selection." },
];

export function DeliveryPromiseStrip() {
  return (
    <section aria-label="GLAMO delivery and trust promises" className="border-y border-black/5 bg-white">
      <div className="container mx-auto grid gap-3 px-4 py-5 md:grid-cols-2 md:px-6 xl:grid-cols-4">
        {promises.map((promise) => (
            <div key={promise.title} className="flex items-start gap-3 rounded-[1.5rem] bg-brand-surfacePink px-4 py-4 ring-1 ring-black/5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-primary shadow-sm">
                {promise.icon}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-brand-textPrimary">{promise.title}</h3>
                <p className="mt-1 text-xs leading-5 text-brand-textMuted">{promise.body}</p>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
