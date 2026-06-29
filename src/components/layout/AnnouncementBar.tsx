"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { SITE_CONFIG } from "@/lib/config";

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("announcement-dismissed")) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    sessionStorage.setItem("announcement-dismissed", "true");
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="relative z-announcement h-9 bg-primary text-neutral-50 flex items-center justify-center"
      role="region"
      aria-label="Announcement"
    >
      <p className="type-label text-xs tracking-[0.1em] text-center px-8">
        AUTHENTIC PRODUCTS ONLY &nbsp;|&nbsp; 7-DAY RETURNS &nbsp;|&nbsp; {SITE_CONFIG.phone}
      </p>
      <button
        onClick={handleDismiss}
        className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full text-neutral-50/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}