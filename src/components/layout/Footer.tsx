"use client";

import Link from "next/link";
import { Leaf, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { SITE_CONFIG } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-[#2C1626] pb-10 pt-16 text-white/75">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.15fr_0.85fr_1fr]">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white">
                <Leaf className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <span>
                <span className="block font-serif text-3xl font-semibold tracking-[0.08em] text-white">GLAMO</span>
                <span className="block text-[9px] uppercase tracking-[0.34em] text-white/55">Nepal</span>
              </span>
            </Link>
            <p className="mt-5 max-w-md text-sm leading-7 text-white/60">
              Curated beauty, skincare and makeup essentials for shoppers in Kathmandu and across Nepal.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a href={SITE_CONFIG.social.instagram} aria-label={`Instagram ${SITE_CONFIG.instagramHandle}`} className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-brand-primary"><FaInstagram size={16} /></a>
              <a href={SITE_CONFIG.social.facebook} aria-label="Facebook" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-brand-primary"><FaFacebook size={16} /></a>
              <a href={SITE_CONFIG.whatsapp} aria-label="WhatsApp" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-[#25D366]"><FaWhatsapp size={16} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-xl font-semibold text-white">Explore</h4>
            <ul className="mt-5 space-y-3 text-sm">
              {[
                ["Shop All", "/shop"],
                ["New Arrivals", "/collections/new-arrivals"],
                ["Best Sellers", "/collections/best-sellers"],
                ["Routines", "/routines"],
                ["Brands", "/brands"],
                ["Beauty Blog", "/blog"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-white/60 transition hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-xl font-semibold text-white">Customer care</h4>
            <div className="mt-5 space-y-4 text-sm text-white/60">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0 text-brand-secondary" />
                <span>{SITE_CONFIG.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="shrink-0 text-brand-secondary" />
                <a href={`tel:${SITE_CONFIG.phone}`} className="transition hover:text-white">{SITE_CONFIG.phone}</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="shrink-0 text-brand-secondary" />
                <a href={`mailto:${SITE_CONFIG.email}`} className="transition hover:text-white">{SITE_CONFIG.email}</a>
              </div>
              <div className="pt-2">
                <div className="flex flex-wrap gap-2">
                  {SITE_CONFIG.paymentMethods.map((method) => (
                    <span key={method} className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-brand-bgDark">
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} {SITE_CONFIG.fullTitle}. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/faq" className="transition hover:text-white">FAQ</Link>
            <Link href="/shipping" className="transition hover:text-white">Shipping</Link>
            <Link href="/returns" className="transition hover:text-white">Returns</Link>
            <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
            <Link href="/terms" className="transition hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
