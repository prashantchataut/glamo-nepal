"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const CF_BEACON_ID = process.env.NEXT_PUBLIC_CF_BEACON_ID;

export function ConditionalAnalytics() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  if (!CF_BEACON_ID) return null;

  return (
    <Script
      id="cf-beacon"
      src="https://static.cloudflareinsights.com/beacon.min.js"
      strategy="afterInteractive"
      data-cf-beacon={`{"token": "${CF_BEACON_ID}"}`}
    />
  );
}
