"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { initEventTracker } from "@/lib/tracking";
import { analytics } from "@/lib/analytics";

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    initEventTracker();
  }, []);

  useEffect(() => {
    analytics.pageView(pathname);
  }, [pathname]);

  return <>{children}</>;
}