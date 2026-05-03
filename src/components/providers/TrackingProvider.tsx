"use client";

import { useEffect } from "react";
import { initEventTracker } from "@/lib/tracking";

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initEventTracker();
  }, []);

  return <>{children}</>;
}