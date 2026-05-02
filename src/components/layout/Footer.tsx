"use client";

import Link from "next/link";
import { Leaf, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { SITE_CONFIG } from "@/lib/constants";

const shopLinks = [
  ["Shop All", "/shop"],
  ["New Arrivals", "/collections/new-arrivals"],
  ["Best Sellers", "/collections/best-sellers"],
  ["Made in Nepal", "/collections/made-in-nepal"],
  ["Routines", "/routines"],
  ["Brands", "/brands"],
];

const supportLinks = [
  ["FAQ", "/faq"],
  ["Shipping", "/shipping"],
  ["Returns", "/returns"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Contact", "/contact"],
];

export function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-surfaceWarm pb-24 pt-14 text-brand-textMuted md:pb-10 md:pt-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.8fr_0.8fr_1.1fr]">
          <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-card">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary-light text-brand-primary ring-1 ring-brand-primary/10">
                <Leaf className="h-5 w-5" strokeWidth={1.6} />
              </span>
              <span>
                <span className="block font-serif text-3xl font-semibold tracking-[0.08em] text-brand-textPrimary">GLAMO</span>
                <span className="block text-[9px] uppercase tracking-[0.34em] text-brand-textMuted">Nepal</span>
              </span>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-7">
              Curated skincare, soft-glam makeup and personal care essentials for shoppers in Kathmandu and across Nepal.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a href={SITE_CONFIG.social.instagram} aria-label={`Instagram ${SITE_CONFIG.instagramHandle}`} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-border bg-brand-bgLight text-brand-primary transition hover:-translate-y-0.5 hover:bg-brand-primary hover:text-white"><FaInstagram size={16} /></a>
              <a href={SITE_CONFIG.social.facebook} aria-label="Facebook" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-border bg-brand-bgLight text-brand-primary transition hover:-translate-y-0.5 hover:bg-brand-primary hover:text-white"><FaFacebook size={16} /></a>
              <a href={SITE_CONFIG.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand-border bg-brand-bgLight text-brand-primary transition hover:-translate-y-0.5 hover:bg-[#25D366] hover:text-white"><FaWhatsapp size={16} /></a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
            <h4 className="font-serif text-2xl font-semibold text-brand-textPrimary">Shop</h4>
            <ul className="mt-5 space-y-3 text-sm">
              {shopLinks.map(([label, href]) => (
                <li key={label}><Link href={href} className="transition hover:text-brand-primary">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
            <h4 className="font-serif text-2xl font-semibold text-brand-textPrimary">Support</h4>
            <ul className="mt-5 space-y-3 text-sm">
              {supportLinks.map(([label, href]) => (
                <li key={label}><Link href={href} className="transition hover:text-brand-primary">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div className="rounded-[2rem] border border-brand-border bg-white p-6 shadow-sm">
            <h4 className="font-serif text-2xl font-semibold text-brand-textPrimary">Customer care</h4>
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-brand-primary" /><span>{SITE_CONFIG.address}</span></div>
              <div className="flex items-center gap-3"><Phone size={18} className="shrink-0 text-brand-primary" /><a href={SITE_CONFIG.whatsapp} target="_blank" rel="noopener noreferrer" className="transition hover:text-brand-primary">{SITE_CONFIG.phone}</a></div>
              <div className="flex items-center gap-3"><Mail size={18} className="shrink-0 text-brand-primary" /><a href={`mailto:${SITE_CONFIG.email}`} className="transition hover:text-brand-primary">{SITE_CONFIG.email}</a></div>
              <div className="rounded-2xl bg-brand-bgLight p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-primary"><ShieldCheck size={15} /> Payment options</div>
                <div className="flex flex-wrap gap-2">
                  {SITE_CONFIG.paymentMethods.map((method) => <span key={method} className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-brand-textPrimary shadow-sm ring-1 ring-brand-border">{method}</span>)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-brand-border pt-6 text-xs md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} {SITE_CONFIG.fullTitle}. All rights reserved.</p>
          <p>Beauty ecommerce curated in Nepal · NPR pricing · WhatsApp support</p>
        </div>
      </div>
    </footer>
  );
}
