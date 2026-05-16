import type { ReactNode } from "react";
import type { Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ComponentErrorBoundary } from "@/components/common/ComponentErrorBoundary";

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export const metadata = {
  title: "GLAMO Nepal — Premium Beauty & Cosmetics",
  description:
    "Curated skincare, soft-glam makeup and personal care essentials for shoppers in Kathmandu and across Nepal.",
  keywords: [
    "GLAMO Nepal",
    "Nepal beauty ecommerce",
    "cosmetics in Kathmandu",
    "skincare Nepal",
  ],
  openGraph: {
    title: "GLAMO Nepal — Premium Beauty & Cosmetics",
    description:
      "Curated skincare, soft-glam makeup and personal care essentials for shoppers in Kathmandu and across Nepal.",
    siteName: "GLAMO Nepal",
    locale: "en_NP",
    type: "website" as const,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "GLAMO Nepal — Premium Beauty & Cosmetics",
    description:
      "Curated skincare, soft-glam makeup and personal care essentials for shoppers in Kathmandu and across Nepal.",
    site: "@glamo_nepal",
    creator: "@glamo_nepal",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className=""
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-rose-50 font-sans text-neutral-900 antialiased">
        <ComponentErrorBoundary name="RootLayout">
          <AppShell>{children}</AppShell>
        </ComponentErrorBoundary>
        <Analytics />
      </body>
    </html>
  );
}