"use client";

import Link from "next/link";
import { Leaf, Mail, MapPin, Phone } from "lucide-react";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { SITE_CONFIG } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t-4 border-brand-primary bg-brand-bgDark pb-10 pt-20 text-white/80">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="flex flex-col gap-6"><Link href="/" className="group flex w-fit flex-col items-start"><div className="flex items-center gap-1.5 text-white"><Leaf className="h-6 w-6 transition-transform duration-300 group-hover:rotate-12" strokeWidth={1.5}/><span className="font-serif text-3xl font-semibold tracking-[0.08em]">GLAMO</span></div><span className="ml-7 text-[9px] font-medium uppercase tracking-[0.35em] text-brand-secondary">Nepal</span></Link><p className="max-w-xs text-sm leading-relaxed text-white/60">Premium beauty, cosmetics and personal care curated for GLAMO NEPAL customers in Kathmandu and across Nepal.</p><div className="flex items-center gap-3"><a href={SITE_CONFIG.social.instagram} aria-label={`Instagram ${SITE_CONFIG.instagramHandle}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-brand-primary"><FaInstagram size={16}/></a><a href={SITE_CONFIG.social.facebook} aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-brand-primary"><FaFacebook size={16}/></a><a href={SITE_CONFIG.whatsapp} aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-[#25D366]"><FaWhatsapp size={16}/></a></div></div>
          <div><h4 className="mb-6 font-serif text-xl font-semibold text-white">Explore</h4><ul className="space-y-3">{[{label:'Home',href:'/'},{label:'Shop All',href:'/shop'},{label:'Collections',href:'/collections'},{label:'Made in Nepal',href:'/collections/made-in-nepal'},{label:'Routines',href:'/routines'},{label:'Brands',href:'/brands'},{label:'Our Story',href:'/about'},{label:'Beauty Blog',href:'/blog'},{label:'Contact Us',href:'/contact'}].map((link)=><li key={link.label}><Link href={link.href} className="text-sm text-white/60 transition hover:pl-1 hover:text-brand-primary">{link.label}</Link></li>)}</ul></div>
          <div><h4 className="mb-6 font-serif text-xl font-semibold text-white">Customer Care</h4><ul className="space-y-3">{[{label:'FAQs',href:'/faq'},{label:'Shipping Policy',href:'/shipping'},{label:'Returns Policy',href:'/returns'},{label:'Privacy Policy',href:'/privacy'},{label:'Terms of Service',href:'/terms'},{label:'Cart',href:'/cart'},{label:'Compare',href:'/compare'}].map((link)=><li key={link.label}><Link href={link.href} className="text-sm text-white/60 transition hover:pl-1 hover:text-brand-primary">{link.label}</Link></li>)}</ul></div>
          <div><h4 className="mb-6 font-serif text-xl font-semibold text-white">Get in Touch</h4><ul className="space-y-5"><li className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-brand-primary"/><span className="text-sm leading-relaxed text-white/60">{SITE_CONFIG.address}</span></li><li className="flex items-center gap-3"><Phone size={18} className="shrink-0 text-brand-primary"/><a href={`tel:${SITE_CONFIG.phone}`} className="text-sm text-white/60 hover:text-brand-primary">{SITE_CONFIG.phone}</a></li><li className="flex items-center gap-3"><Mail size={18} className="shrink-0 text-brand-primary"/><a href={`mailto:${SITE_CONFIG.email}`} className="text-sm text-white/60 hover:text-brand-primary">{SITE_CONFIG.email}</a></li></ul></div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row"><p className="text-center text-xs text-white/40 md:text-left">&copy; {new Date().getFullYear()} {SITE_CONFIG.fullTitle}. All rights reserved.</p><div className="flex flex-wrap items-center gap-2 opacity-80">{SITE_CONFIG.paymentMethods.map((method)=><div key={method} className="rounded bg-white px-3 py-1.5 text-[10px] font-bold text-brand-bgDark">{method}</div>)}</div></div>
      </div>
    </footer>
  );
}
