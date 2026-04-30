import Link from "next/link";
import { Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SITE_CONFIG } from "@/lib/constants";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Contact GLAMO NEPAL",
  description: "Contact GLAMO NEPAL by phone, WhatsApp, Instagram or visit Naya Baneshwor, Mantra In & Out Square, Kathmandu.",
  path: "/contact",
});

const contactCards = [
  { icon: Phone, label: "Phone", value: SITE_CONFIG.phone, href: `tel:${SITE_CONFIG.phone.replace(/\s/g, "")}` },
  { icon: MessageCircle, label: "WhatsApp", value: "Chat with us", href: SITE_CONFIG.whatsapp },
  { icon: Instagram, label: "Instagram", value: SITE_CONFIG.instagramHandle, href: SITE_CONFIG.social.instagram },
  { icon: Mail, label: "Email", value: SITE_CONFIG.email, href: `mailto:${SITE_CONFIG.email}` },
];

export default function ContactPage() {
  return (
    <main className="bg-brand-bgLight">
      <PageHeader eyebrow="Contact GLAMO" title="Visit or message us" description="Reach the GLAMO NEPAL team for product questions, store pickup, order support and launch inquiries." />
      <section className="container mx-auto grid gap-8 px-4 py-12 md:px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm">
            <MapPin className="text-brand-primary" />
            <h2 className="mt-4 font-serif text-3xl font-semibold text-brand-textPrimary">Store location</h2>
            <p className="mt-3 leading-7 text-brand-textMuted">{SITE_CONFIG.address}</p>
            <p className="mt-3 text-sm text-brand-textMuted">Add official store hours and Google Maps embed once confirmed by the owner.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {contactCards.map(({ icon: Icon, label, value, href }) => (
              <Link key={label} href={href} className="rounded-[1.5rem] border border-border/70 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <Icon className="text-brand-primary" />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">{label}</p>
                <p className="mt-1 font-semibold text-brand-textPrimary">{value}</p>
              </Link>
            ))}
          </div>
        </div>
        <form className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm md:p-8">
          <h2 className="font-serif text-3xl font-semibold text-brand-textPrimary">Send a message</h2>
          <p className="mt-2 text-sm text-brand-textMuted">Frontend-only contact form. Connect CRM/email API before production.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {['Name','Email','Phone'].map((label) => (
              <label key={label} className="block text-sm font-semibold text-brand-textPrimary">{label}<input className="mt-2 w-full rounded-2xl border border-border bg-brand-bgLight px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/25" /></label>
            ))}
            <label className="block text-sm font-semibold text-brand-textPrimary md:col-span-2">Message<textarea rows={5} className="mt-2 w-full rounded-2xl border border-border bg-brand-bgLight px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/25" /></label>
          </div>
          <button type="button" className="mt-6 rounded-full bg-brand-primary px-7 py-3 font-semibold text-white transition hover:bg-brand-bgDark">Submit mock message</button>
        </form>
      </section>
    </main>
  );
}
