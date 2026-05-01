"use client";

import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import { SITE_CONFIG } from "@/lib/constants";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setTimeout(() => { setIsSending(false); setForm({ name: "", email: "", phone: "", subject: "", message: "" }); toast.success("Message sent! We'll get back to you soon."); }, 1500);
  };

  return (
    <div className="min-h-screen bg-brand-bgLight">
      <div className="relative overflow-hidden border-b border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_50%,#F7F1EA_100%)] py-14 md:py-20">
        <div className="container mx-auto px-4 text-center md:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">Customer care</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold text-brand-textPrimary md:text-6xl">Get in <span className="italic text-brand-primary">Touch</span></h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-brand-textMuted">Questions, feedback, WhatsApp support or store visit details — we would love to help.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-brand-textPrimary mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Name</label>
                  <input id="contact-name" type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required className="w-full px-4 py-3 rounded-xl border border-border bg-white text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all" />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Email</label>
                  <input id="contact-email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required className="w-full px-4 py-3 rounded-xl border border-border bg-white text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-phone" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Phone</label>
                  <input id="contact-phone" type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-border bg-white text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all" />
                </div>
                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Subject</label>
                  <select id="contact-subject" value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} required className="w-full px-4 py-3 rounded-xl border border-border bg-white text-brand-textPrimary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all">
                    <option value="">Select a subject</option>
                    <option value="order">Order Inquiry</option>
                    <option value="product">Product Question</option>
                    <option value="return">Returns & Refunds</option>
                    <option value="collaboration">Collaboration</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-brand-textPrimary mb-1.5">Message</label>
                <textarea id="contact-message" rows={5} value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} required className="w-full px-4 py-3 rounded-xl border border-border bg-white text-brand-textPrimary placeholder:text-brand-textMuted/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary transition-all resize-none" placeholder="Tell us how we can help..." />
              </div>
              <button type="submit" disabled={isSending} className="w-full py-3.5 bg-brand-primary text-white rounded-full font-semibold hover:bg-brand-bgDark transition-all duration-300 disabled:opacity-60 shadow-lg shadow-brand-primary/20">
                {isSending ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>

          <div>
            <h2 className="font-serif text-2xl font-semibold text-brand-textPrimary mb-6">Store Information</h2>
            <div className="bg-white rounded-2xl border border-border/30 p-6 md:p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0"><MapPin size={18} className="text-brand-primary" strokeWidth={1.5} /></div>
                <div>
                  <p className="font-semibold text-brand-textPrimary text-sm">Address</p>
                  <p className="text-sm text-brand-textMuted mt-0.5" dangerouslySetInnerHTML={{ __html: SITE_CONFIG.address.replace(/,/g, ",<br />") }} />
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0"><Phone size={18} className="text-brand-primary" strokeWidth={1.5} /></div>
                <div>
                  <p className="font-semibold text-brand-textPrimary text-sm">Phone</p>
                  <a href={SITE_CONFIG.whatsapp} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-textMuted hover:text-brand-primary transition-colors">{SITE_CONFIG.phone}</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0"><Mail size={18} className="text-brand-primary" strokeWidth={1.5} /></div>
                <div>
                  <p className="font-semibold text-brand-textPrimary text-sm">Email</p>
                  <a href={`mailto:${SITE_CONFIG.email}`} className="text-sm text-brand-textMuted hover:text-brand-primary transition-colors">{SITE_CONFIG.email}</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0"><Clock size={18} className="text-brand-primary" strokeWidth={1.5} /></div>
                <div>
                  <p className="font-semibold text-brand-textPrimary text-sm">Hours</p>
                  <p className="text-sm text-brand-textMuted">Sun–Fri: 10AM–7PM</p>
                  <p className="text-sm text-brand-textMuted">Sat: 10AM–5PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-border/30">
                {[
                  { icon: <FaInstagram size={18} />, href: SITE_CONFIG.social.instagram },
                  { icon: <FaFacebook size={18} />, href: SITE_CONFIG.social.facebook },
                ].map((s, i) => (
                  <a key={i} href={s.href} className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300">{s.icon}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}