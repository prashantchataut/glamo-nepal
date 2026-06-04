import type { ReactNode } from "react";
import type { Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import dynamic from "next/dynamic";
import { ConditionalAnalytics } from "@/components/common/ConditionalAnalytics";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ComponentErrorBoundary } from "@/components/common/ComponentErrorBoundary";
import { FirebaseAuthProvider } from "@/components/auth/FirebaseAuthProvider";

const ConvexClientProvider = dynamic(
  () => import("./ConvexClientProvider").then((m) => m.ConvexClientProvider),
  { ssr: false },
);

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
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
      className={`${inter.variable} ${playfair.variable}`}
    >
      <body className="min-h-screen bg-rose-50 font-sans text-neutral-900 antialiased">
        <ConvexClientProvider>
          <FirebaseAuthProvider>
            <ComponentErrorBoundary name="RootLayout">
              <AppShell>{children}</AppShell>
            </ComponentErrorBoundary>
          </FirebaseAuthProvider>
        </ConvexClientProvider>
        <ConditionalAnalytics />
      </body>
    </html>
  );
}