import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata = {
  title: "GLAMO NEPAL — Premium Beauty & Cosmetics",
  description: "Curated skincare, soft-glam makeup and personal care essentials for shoppers in Kathmandu and across Nepal.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://cdn.pixabay.com https://res.cloudinary.com https://img.freepik.com https://images.pexels.com; connect-src 'self' https://api.glamonepal.com; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" />
      </head>
      <body className="min-h-screen bg-brand-bgLight font-sans text-brand-textPrimary antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}