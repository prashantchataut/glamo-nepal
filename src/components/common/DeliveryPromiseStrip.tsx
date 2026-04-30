import { Clock3, MapPin, PackageCheck, ShieldCheck } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";

const promises = [
  { icon: Clock3, title: "Valley estimate", body: "Kathmandu Valley delivery rules are mocked at 1-2 business days." },
  { icon: MapPin, title: "Store base", body: SITE_CONFIG.address },
  { icon: PackageCheck, title: "Courier-ready", body: "Delivery fees and COD rules are isolated for backend replacement." },
  { icon: ShieldCheck, title: "Authenticity-first", body: "Supplier invoices, batch and expiry data are required before launch." },
];

export function DeliveryPromiseStrip() {
  return (
    <section aria-label="GLAMO delivery and trust promises" className="border-y border-brand-secondary/20 bg-white">
      <div className="container mx-auto grid gap-3 px-4 py-5 md:grid-cols-2 md:px-6 xl:grid-cols-4">
        {promises.map((promise) => {
          const Icon = promise.icon;
          return (
            <div key={promise.title} className="flex items-start gap-3 rounded-2xl bg-brand-bgLight px-4 py-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-brand-textPrimary">{promise.title}</h3>
                <p className="mt-1 text-xs leading-5 text-brand-textMuted">{promise.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
