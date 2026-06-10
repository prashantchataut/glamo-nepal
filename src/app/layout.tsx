import type { ReactNode } from "react";
import type { Viewport } from "next";
import localFont from "next/font/local";
import { ConditionalAnalytics } from "@/components/common/ConditionalAnalytics";
import { GoogleAnalytics } from "@/components/seo/GoogleAnalytics";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ComponentErrorBoundary } from "@/components/common/ComponentErrorBoundary";
import { FirebaseAuthProvider } from "@/components/auth/FirebaseAuthProvider";

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Self-hosted fonts — eliminate Google Fonts network dependency for CSP compliance and performance.
// Replace placeholder .woff2 files in src/fonts/ with real variable-weight files downloaded from Google Fonts.
const outfit = localFont({
  src: "../../fonts/outfit.woff2",
  variable: "--font-body",
  display: "swap",
  weight: "100 900",
});

const playfair = localFont({
  src: "../../fonts/playfair-display.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "400 900",
});

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
      className={`${outfit.variable} ${playfair.variable}`}
    >
      <body className="min-h-screen bg-rose-50 font-sans text-neutral-900 antialiased">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-white focus:rounded-lg focus:top-4 focus:left-4">
          Skip to content
        </a>
        <FirebaseAuthProvider>
            <ComponentErrorBoundary name="RootLayout">
              <AppShell>{children}</AppShell>
            </ComponentErrorBoundary>
          </FirebaseAuthProvider>
        <ConditionalAnalytics />
        <GoogleAnalytics />
      </body>
    </html>
  );
}