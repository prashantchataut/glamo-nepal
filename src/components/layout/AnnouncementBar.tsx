"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/delivery";
import { formatNPR } from "@/lib/utils";

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
        FREE DELIVERY ON ORDERS OVER {formatNPR(FREE_DELIVERY_THRESHOLD)} &nbsp;|&nbsp; AUTHENTIC PRODUCTS ONLY &nbsp;|&nbsp; 7-DAY RETURNS
      </p>
      <button
        onClick={handleDismiss}
        className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}