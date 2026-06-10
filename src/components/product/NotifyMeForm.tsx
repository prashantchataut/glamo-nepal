"use client";
import { useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";

export function NotifyMeForm({ productName }: { productName: string }) {
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contact.trim()) {
      toast.error("Please enter your email or phone number.");
      return;
    }
    setSubmitted(true);
    toast.success("We will let you know when this item is available.");
  }

  return (
    <div className="rounded-[2rem] border border-brand-secondary/30 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 text-primary" size={20} aria-hidden="true" />
        <div>
          <h3 className="font-display text-2xl font-semibold text-neutral-900">Notify me</h3>
          <p className="mt-1 text-sm leading-6 text-neutral-500">Share your email or Nepal phone number and GLAMO will contact you when {productName} is back.</p>
        </div>
      </div>
      <div aria-live="polite">
        {submitted ? (
          <p className="mt-4 text-sm font-semibold text-primary" role="status">Request saved for {productName}.</p>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label htmlFor={`notify-${productName.replace(/\s+/g, "-").toLowerCase()}`} className="sr-only">Email or phone number for {productName} notification</label>
            <input
              id={`notify-${productName.replace(/\s+/g, "-").toLowerCase()}`}
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="Email or phone number"
              className="min-h-12 flex-1 rounded-full border border-border bg-neutral-50 px-4 text-sm outline-none focus:ring-2 focus:ring-brand-primary/25"
            />
            <button className="min-h-[44px] rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-950">Notify me</button>
          </form>
        )}
      </div>
    </div>
  );
}