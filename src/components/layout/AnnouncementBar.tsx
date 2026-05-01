"use client";

import { useState, useEffect } from "react";
import { X, Truck, Leaf, ShieldCheck, Phone } from "lucide-react";
import { ANNOUNCEMENT_MESSAGES } from "@/lib/constants";

const iconMap = {
  truck: Truck,
  leaf: Leaf,
  shield: ShieldCheck,
  phone: Phone,
};

const WHATSAPP_URL = "https://wa.me/9779818212188";

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("announcement-dismissed");
    if (dismissed) setIsVisible(false);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("announcement-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="sticky top-0 z-[40] bg-brand-primary text-white text-xs md:text-sm font-medium py-2.5 overflow-hidden">
      <div className="flex whitespace-nowrap overflow-hidden">
        <div className="animate-marquee-scroll flex items-center gap-12 px-6">
          {ANNOUNCEMENT_MESSAGES.map((msg, i) => {
            const Icon = iconMap[msg.icon];
            const isPhone = msg.icon === "phone";
            return (
              <span key={`a1-${i}`} className="flex items-center gap-2 text-white/95">
                {Icon && <Icon size={14} strokeWidth={1.5} />}
                {isPhone ? (
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat with us on WhatsApp"
                    className="hover:underline hover:text-white transition-opacity hover:opacity-90"
                  >
                    {msg.text}
                  </a>
                ) : (
                  <span>{msg.text}</span>
                )}
              </span>
            );
          })}
          {ANNOUNCEMENT_MESSAGES.map((msg, i) => {
            const Icon2 = iconMap[msg.icon];
            const isPhone = msg.icon === "phone";
            return (
              <span key={`a2-${i}`} className="flex items-center gap-2 text-white/95 ml-12" aria-hidden="true">
                {Icon2 && <Icon2 size={14} strokeWidth={1.5} />}
                {isPhone ? (
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Chat with us on WhatsApp"
                    className="hover:underline hover:text-white transition-opacity hover:opacity-90"
                    tabIndex={-1}
                  >
                    {msg.text}
                  </a>
                ) : (
                  <span>{msg.text}</span>
                )}
              </span>
            );
          })}
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
        aria-label="Close announcement"
      >
        <X size={13} />
      </button>
    </div>
  );
}