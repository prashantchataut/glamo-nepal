import type { ReactNode } from "react";
import type { Viewport } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import { ConditionalAnalytics } from "@/components/common/ConditionalAnalytics";
import { GoogleAnalytics } from "@/components/seo/GoogleAnalytics";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ComponentErrorBoundary } from "@/components/common/ComponentErrorBoundary";
import { FirebaseAuthProvider } from "@/components/auth/FirebaseAuthProvider";
import { CsrfBootstrap } from "@/components/auth/CsrfBootstrap";
import { getNonce } from "@/components/providers/NonceProvider";

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

// Fonts are downloaded and self-hosted at build time by next/font (no runtime
// third-party request), satisfying CSP and performance requirements.
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  metadataBase: new URL("https://glamonepal.com"),
  title: "GLAMO Nepal - Premium Beauty & Cosmetics",
  description:
    "Curated skincare, soft-glam makeup and personal care essentials for shoppers in Kathmandu Valley.",
  keywords: [
    "GLAMO Nepal",
    "Nepal beauty ecommerce",
    "cosmetics in Kathmandu",
    "skincare Nepal",
  ],
  openGraph: {
    title: "GLAMO Nepal - Premium Beauty & Cosmetics",
    description:
      "Curated skincare, soft-glam makeup and personal care essentials for shoppers in Kathmandu Valley.",
    siteName: "GLAMO Nepal",
    locale: "en_NP",
    type: "website" as const,
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "GLAMO Nepal - Premium Beauty & Cosmetics",
    description:
      "Curated skincare, soft-glam makeup and personal care essentials for shoppers in Kathmandu Valley.",
    site: "@glamo_nepal",
    creator: "@glamo_nepal",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const nonce = await getNonce();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${playfair.variable}`}
    >
      <body className="min-h-screen bg-rose-50 font-sans text-neutral-900 antialiased">
        <CsrfBootstrap />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-primary focus:text-white focus:rounded-lg focus:top-4 focus:left-4">
          Skip to content
        </a>
        <FirebaseAuthProvider>
            <ComponentErrorBoundary name="RootLayout">
              <AppShell>{children}</AppShell>
            </ComponentErrorBoundary>
          </FirebaseAuthProvider>
        <ConditionalAnalytics />
        <GoogleAnalytics nonce={nonce} />
      </body>
    </html>
  );
}