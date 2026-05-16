"use client";

import Link from "next/link";
import { Mail, MapPin, Phone, ArrowRight } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";
import { csrfHeaders } from "@/lib/csrf";
import { InstagramIcon, FacebookIcon } from "@/components/ui/illustrations/SocialIcons";

const shopLinks = [
  { label: "Shop All", href: "/shop" },
  { label: "New Arrivals", href: "/collections/new-arrivals" },
  { label: "Best Sellers", href: "/collections/best-sellers" },
  { label: "Brands", href: "/brands" },
  { label: "Routines", href: "/routines" },
];

const categoryLinks = [
  { label: "Skincare", href: "/shop?category=skincare" },
  { label: "Makeup", href: "/shop?category=makeup" },
  { label: "Haircare", href: "/shop?category=haircare" },
  { label: "Bodycare", href: "/shop?category=bodycare" },
  { label: "Fragrance", href: "/shop?category=fragrance" },
];

const helpLinks = [
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Shipping Policy", href: "/shipping-policy" },
  { label: "Return Policy", href: "/return-policy" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-[1480px] px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <div className="grid gap-8 rounded-[34px] border border-white/10 bg-cream-50/[0.035] p-5 sm:p-7 lg:grid-cols-[1.1fr_0.9fr] lg:p-9">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">Join the GLAMO beauty list</p>
            <h2 className="mt-3 max-w-xl font-display text-4xl font-semibold leading-[0.95] tracking-[-0.04em] text-white md:text-6xl">
              Softer routines, new drops and Nepal delivery notes.
            </h2>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const email = (form.elements.namedItem("email") as HTMLInputElement)?.value;
              if (email) {
                fetch("/api/newsletter", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...csrfHeaders() },
                  body: JSON.stringify({ email }),
                }).catch(() => {});
                form.reset();
              }
            }}
            className="flex flex-col justify-end gap-3"
          >
            <label htmlFor="footer-email" className="sr-only">Email address</label>
            <div className="flex min-h-14 items-center gap-3 rounded-none border border-white/12 bg-cream-50 px-4 text-ink">
              <Mail size={17} strokeWidth={1.7} className="shrink-0 text-cream-400" />
              <input
                id="footer-email"
                type="email"
                name="email"
                placeholder="Your email address"
                required
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-cream-400"
              />
              <button type="submit" className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-none bg-ink text-white transition hover:bg-brand-rose" aria-label="Subscribe">
                <ArrowRight size={17} strokeWidth={1.8} />
              </button>
            </div>
            <p className="text-xs leading-5 text-white/50">No spam — only launches, routines and practical beauty notes.</p>
          </form>
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr_1fr]">
          <div>
            <Link href="/" className="inline-block text-2xl font-semibold uppercase tracking-[0.18em] text-white transition hover:text-brand-blush">
              GLAMO
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/62">
              Premium beauty curated for Nepal: authentic skincare, makeup, haircare and gifting essentials with clear delivery support.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" aria-label={`Instagram ${SITE_CONFIG.instagramHandle}`} className="flex min-h-11 min-w-11 items-center justify-center rounded-none border border-white/10 text-white/70 transition hover:border-white/40 hover:text-white">
                <InstagramIcon size={18} />
              </a>
              <a href={SITE_CONFIG.social.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex min-h-11 min-w-11 items-center justify-center rounded-none border border-white/10 text-white/70 transition hover:border-white/40 hover:text-white">
                <FacebookIcon size={18} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Shop</h3>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 transition hover:text-white">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Categories</h3>
            <ul className="space-y-3">
              {categoryLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 transition hover:text-white">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">Help</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-1">
              {helpLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 transition hover:text-white">{link.label}</Link>
                </li>
              ))}
            </ul>
            <div className="mt-7 space-y-3 text-sm text-white/62">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-white/40" />
                <span>{SITE_CONFIG.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="shrink-0 text-white/40" />
                <a href={SITE_CONFIG.whatsapp} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">{SITE_CONFIG.phone}</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="shrink-0 text-white/40" />
                <a href={`mailto:${SITE_CONFIG.email}`} className="transition hover:text-white">{SITE_CONFIG.email}</a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} {SITE_CONFIG.fullTitle}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {SITE_CONFIG.paymentMethods.map((method) => (
              <span key={method} className="uppercase tracking-[0.12em]">{method}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
