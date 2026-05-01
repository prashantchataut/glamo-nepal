import type { ReactNode } from "react";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { JsonLd } from "@/components/seo/JsonLd";
import { defaultMetadata, organizationJsonLd } from "@/lib/seo";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata = defaultMetadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-brand-bgLight font-sans text-brand-textPrimary antialiased">
        <JsonLd data={organizationJsonLd()} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
