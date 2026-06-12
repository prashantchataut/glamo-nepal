"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Clock, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";
import { contactSchema, type ContactFormData } from "@/lib/validations/contact";
import { csrfHeaders, ensureCsrfToken, setCsrfToken } from "@/lib/csrf";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ContactClient() {
  const [isSending, setIsSending] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactFormData>({ resolver: zodResolver(contactSchema), defaultValues: { name: "", email: "", phone: "", subject: "", message: "" } });

  const onSubmit = async (data: ContactFormData) => {
    setIsSending(true);
    try {
      await ensureCsrfToken();
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json", ...csrfHeaders() }, body: JSON.stringify(data) });
      const token = res.headers.get("x-csrf-token");
      if (token) setCsrfToken(token);
      if (!res.ok) {
        if (res.status === 503) toast.error("Contact form is not yet available. Please message us on WhatsApp or email hello@glamonepal.com.");
        else throw new Error("Failed to send message");
        return;
      }
      toast.success("Message sent. We will get back to you soon.");
      reset();
    } catch {
      toast.error("Something went wrong. Please try again or message us on WhatsApp.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="bg-neutral-50 py-12 md:py-16">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="border border-neutral-200 bg-white p-6 shadow-card md:p-8">
          <h2 className="font-display text-4xl font-medium leading-tight text-neutral-900">Product help, orders and partnerships.</h2>
          <form onSubmit={handleSubmit(onSubmit)} method="POST" action="/api/contact" noValidate className="mt-8 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2"><Input label="Name" type="text" placeholder="Your name" {...register("name")} error={errors.name?.message} /><Input label="Email" type="email" placeholder="you@example.com" {...register("email")} error={errors.email?.message} /></div>
            <div className="grid gap-5 sm:grid-cols-2"><Input label="Phone" type="tel" placeholder="+977 98XXXXXXXX" {...register("phone")} error={errors.phone?.message} /><div><label htmlFor="contact-subject" className="type-label mb-2 block text-neutral-500">Subject</label><select id="contact-subject" {...register("subject")} className="min-h-11 w-full border-b border-neutral-300 bg-transparent py-3 text-sm text-neutral-900 outline-none focus:border-primary"><option value="">Select a subject</option><option value="order">Order inquiry</option><option value="product">Product question</option><option value="return">Returns and refunds</option><option value="collaboration">Collaboration</option><option value="other">Other</option></select>{errors.subject && <p role="alert" className="mt-1 text-xs text-error">{errors.subject.message}</p>}</div></div>
            <div><label htmlFor="contact-message" className="type-label mb-2 block text-neutral-500">Message</label><textarea id="contact-message" rows={6} {...register("message")} className="w-full border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-primary" placeholder="Tell us how we can help..." />{errors.message && <p role="alert" className="mt-1 text-xs text-error">{errors.message.message}</p>}</div>
            <Button type="submit" disabled={isSending} className="w-full sm:w-auto">{isSending ? <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={18} /> Sending</span> : "Send message"}</Button>
          </form>
        </div>
        <aside className="border border-neutral-200 bg-neutral-100 p-6 md:p-8">
          <h2 className="font-display text-4xl font-medium leading-tight text-neutral-900">Kathmandu care desk.</h2>
          <div className="mt-8 space-y-5 text-sm leading-7 text-neutral-600">
            <div className="flex gap-4"><MapPin className="mt-1 text-primary" size={18} /><p>{SITE_CONFIG.address}</p></div>
            <div className="flex gap-4"><Phone className="mt-1 text-primary" size={18} /><a href={SITE_CONFIG.whatsapp} className="hover:text-primary">{SITE_CONFIG.phone}</a></div>
            <div className="flex gap-4"><Mail className="mt-1 text-primary" size={18} /><a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-primary">{SITE_CONFIG.email}</a></div>
            <div className="flex gap-4"><Clock className="mt-1 text-primary" size={18} /><p>Sun-Fri: 10AM-7PM<br />Sat: 10AM-5PM</p></div>
          </div>
        </aside>
      </div>
    </section>
  );
}
