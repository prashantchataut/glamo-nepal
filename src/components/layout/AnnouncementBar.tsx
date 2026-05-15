"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

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
      className="relative z-announcement h-9 bg-primary text-white flex items-center justify-center"
      role="region"
      aria-label="Announcement"
    >
      <p className="type-label text-[11px] tracking-[0.1em] text-center px-8">
        FREE DELIVERY ON ORDERS OVER रू 2,000 &nbsp;|&nbsp; AUTHENTIC PRODUCTS ONLY &nbsp;|&nbsp; 7-DAY RETURNS
      </p>
      <button
        onClick={handleDismiss}
        className="absolute right-3 flex h-6 w-6 items-center justify-center text-white/70 transition-colors hover:text-white"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}