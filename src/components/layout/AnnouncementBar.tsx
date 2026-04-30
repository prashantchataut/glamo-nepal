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
    <div className="relative bg-brand-primary text-white text-xs md:text-sm font-medium py-2.5 overflow-hidden z-50">
      <div className="flex whitespace-nowrap overflow-hidden">
        <div className="animate-marquee-scroll flex items-center gap-12 px-6">
          {ANNOUNCEMENT_MESSAGES.map((msg, i) => {
            const Icon = iconMap[msg.icon];
            return (
              <span key={`a1-${i}`} className="flex items-center gap-2 text-white/95">
                {Icon && <Icon size={14} strokeWidth={1.5} />}
                <span>{msg.text}</span>
              </span>
            );
          })}
          {ANNOUNCEMENT_MESSAGES.map((msg, i) => {
            const Icon2 = iconMap[msg.icon];
            return (
              <span key={`a2-${i}`} className="flex items-center gap-2 text-white/95 ml-12">
                {Icon2 && <Icon2 size={14} strokeWidth={1.5} />}
                <span>{msg.text}</span>
              </span>
            );
          })}
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}