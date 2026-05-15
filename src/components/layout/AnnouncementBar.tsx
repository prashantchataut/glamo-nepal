"use client";
import { useEffect, useState } from "react";
import { Leaf, Phone, ShieldCheck, Truck, X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";
import { ANNOUNCEMENT_MESSAGES } from "@/lib/constants";

const iconMap = { truck: Truck, leaf: Leaf, shield: ShieldCheck, phone: Phone };
const WHATSAPP_URL = SITE_CONFIG.whatsapp;

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("announcement-dismissed")) setIsVisible(false);
  }, []);

  function handleDismiss() {
    setIsVisible(false);
    sessionStorage.setItem("announcement-dismissed", "true");
  }

  if (!isVisible) return null;

  return (
    <div className="font-label sticky top-0 z-[40] overflow-hidden border-b border-brand-border/70 bg-brand-surfaceWarm/95 text-xs font-bold uppercase tracking-[0.16em] text-brand-textPrimary backdrop-blur-xl md:text-xs" role="marquee" aria-label="Announcements">
      <div className="flex whitespace-nowrap overflow-hidden py-3">
        <div className="animate-marquee-scroll flex items-center gap-8 px-6" aria-hidden="true">
          {[...ANNOUNCEMENT_MESSAGES, ...ANNOUNCEMENT_MESSAGES].map((msg, i) => {
            const Icon = iconMap[msg.icon];
            const content = (
              <span className="inline-flex items-center gap-2 text-brand-textMuted">
                {Icon ? <Icon size={14} className="text-brand-primary" strokeWidth={1.8} /> : null}
                <span>{msg.text}</span>
              </span>
            );
            return msg.icon === "phone" ? (
              <a key={`${msg.text}-${i}`} href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 underline decoration-brand-primary/30 underline-offset-2 transition hover:decoration-brand-primary hover:text-brand-primary">
                {content}
              </a>
            ) : (
              <span key={`${msg.text}-${i}`}>{content}</span>
            );
          })}
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-textMuted shadow-sm transition hover:text-brand-primary"
        aria-label="Close announcement"
      >
        <X size={13} />
      </button>
    </div>
  );
}