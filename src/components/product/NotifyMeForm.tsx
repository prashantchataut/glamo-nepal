"use client";
import { useState } from "react";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ensureCsrfToken, CSRF_HEADER_NAME } from "@/lib/csrf";

export function NotifyMeForm({ productName }: { productName: string }) {
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = contact.trim();
    if (!email) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setSending(true);
    try {
      const csrfToken = await ensureCsrfToken();
      if (!csrfToken) {
        toast.error("Could not load security token. Please refresh and try again.");
        return;
      }
      const res = await fetch("/api/newsletter", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", [CSRF_HEADER_NAME]: csrfToken },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.message || "We could not save your request. Please try again.");
        return;
      }
      setSubmitted(true);
      toast.success("We will let you know when this item is available.");
    } catch {
      toast.error("We could not save your request. Please check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-[2rem] border border-brand-secondary/30 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Bell className="mt-0.5 text-primary" size={20} aria-hidden="true" />
        <div>
          <h3 className="font-display text-2xl font-semibold text-neutral-900">Notify me</h3>
          <p className="mt-1 text-sm leading-6 text-neutral-500">Share your email and GLAMO will contact you when {productName} is back.</p>
        </div>
      </div>
      <div aria-live="polite">
        {submitted ? (
          <p className="mt-4 text-sm font-semibold text-primary" role="status">Request saved for {productName}.</p>
        ) : (
          <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <label htmlFor={`notify-${productName.replace(/\s+/g, "-").toLowerCase()}`} className="sr-only">Email address for {productName} notification</label>
            <input
              id={`notify-${productName.replace(/\s+/g, "-").toLowerCase()}`}
              type="email"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className="min-h-12 flex-1 rounded-full border border-border bg-neutral-50 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/10"
            />
            <button disabled={sending} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-950 disabled:cursor-not-allowed disabled:opacity-60">
              {sending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
              {sending ? "Saving..." : "Notify me"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}