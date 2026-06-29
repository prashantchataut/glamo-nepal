"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/**
 * Site-wide promotional popup.
 *
 * This is what makes the admin "Popups" manager actually VISIBLE to shoppers:
 * it fetches the currently-active popup from the public endpoint
 * (GET /api/v1/popups/active) and renders it as an overlay. Previously the
 * storefront never read popups at all, so an admin could create a popup and
 * have no way to see where it appeared.
 *
 * Behaviour:
 *  - Client-only (mounted via next/dynamic ssr:false) so it never blocks SSR.
 *  - Honors the popup's `trigger_type` (ON_LOAD) and `delay_ms`.
 *  - Suppresses re-show for `cookie_days` using a localStorage flag keyed by
 *    popup id, so a returning visitor isn't nagged. `cookie_days` null/0 = show
 *    every visit until the popup's expires_at.
 *  - Silent on any error - a failed popup fetch must never break the storefront.
 *  - Never shows on admin routes (AppShell already gates those, but this is
 *    mounted only in the public branch of AppShell).
 */
interface ActivePopup {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  link_url: string | null;
  trigger_type: string | null;
  delay_ms: number | null;
  cookie_days: number | null;
  starts_at: string | null;
  expires_at: string | null;
}

const SUPPRESS_KEY = "glamo:popupDismissed";

function isSuppressed(popupId: string, cookieDays: number | null): boolean {
  if (typeof window === "undefined") return true;
  try {
    // cookie_days null/0 → never suppress (show every visit).
    if (!cookieDays || cookieDays <= 0) return false;
    const raw = window.localStorage.getItem(`${SUPPRESS_KEY}:${popupId}`);
    if (!raw) return false;
    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;
    const ageMs = Date.now() - dismissedAt;
    return ageMs < cookieDays * 86400000;
  } catch {
    return false;
  }
}

function markSuppressed(popupId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${SUPPRESS_KEY}:${popupId}`, String(Date.now()));
  } catch {
    // Storage may be unavailable (private mode); ignore - popup just re-shows.
  }
}

export function SitePopup() {
  const [popup, setPopup] = useState<ActivePopup | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
        const res = await fetch(`${base.replace(/\/$/, "")}/popups/active`, {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { success?: boolean; data?: ActivePopup | null };
        if (cancelled) return;
        const data = json?.data;
        if (!data || !data.id) return;

        // Respect per-popup suppression window before showing.
        if (isSuppressed(data.id, data.cookie_days)) return;

        setPopup(data);
        const delay = Number(data.delay_ms ?? 0);
        const trigger = String(data.trigger_type ?? "ON_LOAD").toUpperCase();
        if (trigger !== "ON_LOAD") return; // only ON_LOAD is supported for now
        const timer = setTimeout(() => {
          if (!cancelled) setOpen(true);
        }, Number.isFinite(delay) && delay > 0 ? delay : 0);
        return () => clearTimeout(timer);
      } catch {
        // Silent: popup is non-essential.
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close on Escape for accessibility.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    // Lock background scroll while open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    setOpen(false);
    if (popup) markSuppressed(popup.id);
  }

  if (!open || !popup) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-popup-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Close popup"
        onClick={handleClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm transition hover:bg-white hover:text-neutral-900"
        >
          <X size={18} />
        </button>

        {popup.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={popup.image_url}
            alt={popup.title}
            className="max-h-[55vh] w-full object-cover"
          />
        ) : null}

        <div className="p-6 md:p-8">
          <h2 id="site-popup-title" className="font-display text-2xl font-semibold text-neutral-900">
            {popup.title}
          </h2>
          {popup.content ? (
            <div
              className="mt-3 text-sm leading-relaxed text-neutral-600 [&_a]:font-semibold [&_a]:text-rose-600 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: popup.content }}
            />
          ) : null}

          {popup.link_url ? (
            <a
              href={popup.link_url}
              onClick={handleClose}
              className="mt-6 inline-flex items-center justify-center rounded-full bg-neutral-900 px-6 py-3 text-sm font-semibold text-neutral-50 transition hover:bg-neutral-800"
            >
              Shop now
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
