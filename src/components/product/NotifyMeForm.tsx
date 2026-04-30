"use client";

import { useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import type { Product } from "@/store/useCartStore";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(\+?977)?9[78]\d{8}$/;

export function NotifyMeForm({ product }: { product: Product }) {
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = contact.trim();
    if (!emailPattern.test(value) && !phonePattern.test(value.replace(/[\s-]/g, ""))) {
      toast.error("Enter a valid email or Nepal mobile number.");
      return;
    }
    setSubmitted(true);
    trackEvent("notify_me_submitted", { productId: product.id, productSlug: product.slug, sku: product.sku, contactType: value.includes("@") ? "email" : "phone" });
    toast.success("Mock stock alert saved. Connect backend notifications before launch.");
  };

  return (
    <div className="rounded-[1.75rem] border border-dashed border-brand-secondary/50 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
          {submitted ? <CheckCircle2 size={20} /> : <Bell size={20} />}
        </div>
        <div>
          <h3 className="font-serif text-2xl font-semibold text-brand-textPrimary">Back-in-stock alert</h3>
          <p className="mt-1 text-sm leading-6 text-brand-textMuted">Frontend-only capture for now. Real email/SMS alerts require backend storage and consent handling.</p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor={`notify-${product.id}`}>Email or Nepal phone</label>
        <input
          id={`notify-${product.id}`}
          value={contact}
          onChange={(event) => setContact(event.target.value)}
          placeholder="Email or Nepal mobile number"
          className="min-h-12 flex-1 rounded-full border border-border bg-brand-bgLight px-4 text-sm outline-none focus:ring-2 focus:ring-brand-primary/30"
        />
        <button type="submit" className="min-h-12 rounded-full bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-bgDark focus:outline-none focus:ring-2 focus:ring-brand-primary/40">Notify me</button>
      </form>
      {submitted ? <p className="mt-3 text-xs font-semibold text-brand-primary">Saved locally for demo. Backend notification service still required.</p> : null}
    </div>
  );
}
