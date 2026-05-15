"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Clock, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";
import { contactSchema, type ContactFormData } from "@/lib/validations/contact";
import { csrfHeaders } from "@/lib/csrf";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ContactClient() {
  const [isSending, setIsSending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "" },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...csrfHeaders() },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        if (res.status === 503) {
          toast.error("Contact form is not yet available. Please message us on WhatsApp or email hello@glamonepal.com.");
        } else {
          throw new Error("Failed to send message");
        }
        return;
      }
      toast.success("Message sent! We'll get back to you soon.");
      reset();
    } catch {
      toast.error("Something went wrong. Please try again or message us on WhatsApp.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <section className="relative overflow-hidden border-b border-neutral-200 bg-neutral-50 py-12 md:py-20">
        <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-12 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="container relative mx-auto px-4 text-center md:px-6">
          <p className="type-label text-xs font-bold uppercase tracking-[0.24em] text-primary">Customer care</p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-neutral-900 md:text-5xl lg:text-6xl">
            Get in <span className="italic text-primary">Touch</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-neutral-500">Questions, feedback, WhatsApp support or store visit details — we would love to help.</p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div>
            <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-6">Send Us a Message</h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Name" type="text" placeholder="Your name" {...register("name")} error={errors.name?.message} />
                <Input label="Email" type="email" placeholder="you@example.com" {...register("email")} error={errors.email?.message} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Input label="Phone" type="tel" placeholder="+977 98XXXXXXXX" {...register("phone")} error={errors.phone?.message} />
                <div className="w-full">
                  <label htmlFor="contact-subject" className="type-label mb-2 block text-neutral-400">Subject</label>
                  <select
                    id="contact-subject"
                    {...register("subject")}
                    aria-invalid={errors.subject ? "true" : undefined}
                    aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                    className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-3 font-sans text-body-md text-neutral-900 transition-colors duration-200 focus:border-primary focus:outline-none"
                  >
                    <option value="">Select a subject</option>
                    <option value="order">Order Inquiry</option>
                    <option value="product">Product Question</option>
                    <option value="return">Returns & Refunds</option>
                    <option value="collaboration">Collaboration</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.subject && <p id="contact-subject-error" role="alert" className="mt-1 text-xs text-error">{errors.subject.message}</p>}
                </div>
              </div>
              <div className="w-full">
                <label htmlFor="contact-message" className="type-label mb-2 block text-neutral-400">Message</label>
                <textarea
                  id="contact-message"
                  rows={5}
                  {...register("message")}
                  aria-invalid={errors.message ? "true" : undefined}
                  aria-describedby={errors.message ? "contact-message-error" : undefined}
                  className="w-full border-0 border-b border-neutral-300 bg-transparent px-0 py-3 font-sans text-body-md text-neutral-900 transition-colors duration-200 placeholder:text-neutral-400 focus:border-primary focus:outline-none"
                  placeholder="Tell us how we can help..."
                />
                {errors.message && <p id="contact-message-error" role="alert" className="mt-1 text-xs text-error">{errors.message.message}</p>}
              </div>
              <Button type="submit" disabled={isSending} className="w-full">
                {isSending ? (<span className="inline-flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={18} />Sending...</span>) : "Send Message"}
              </Button>
            </form>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-neutral-900 mb-6">Store Information</h2>
            <div className="border border-neutral-200 bg-white p-6 md:p-8 space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10"><MapPin size={18} className="text-primary" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Address</p>
                  <p className="mt-0.5 text-sm text-neutral-500" dangerouslySetInnerHTML={{ __html: SITE_CONFIG.address.replace(/,/g, ",<br />") }} />
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10"><Phone size={18} className="text-primary" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Phone</p>
                  <a href={SITE_CONFIG.whatsapp} target="_blank" rel="noopener noreferrer" className="cursor-pointer text-sm text-neutral-500 transition-colors hover:text-primary">{SITE_CONFIG.phone}</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10"><Mail size={18} className="text-primary" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Email</p>
                  <a href={`mailto:${SITE_CONFIG.email}`} className="cursor-pointer text-sm text-neutral-500 transition-colors hover:text-primary">{SITE_CONFIG.email}</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10"><Clock size={18} className="text-primary" strokeWidth={1.5} /></div>
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Hours</p>
                  <p className="text-sm text-neutral-500">Sun–Fri: 10AM–7PM</p>
                  <p className="text-sm text-neutral-500">Sat: 10AM–5PM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 border-t border-neutral-200 pt-4">
                {[
                  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>, href: SITE_CONFIG.social.instagram },
                  { icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>, href: SITE_CONFIG.social.facebook },
                ].map((s, i) => (
                  <a key={i} href={s.href} className="flex h-10 w-10 cursor-pointer items-center justify-center bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-white">{s.icon}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}