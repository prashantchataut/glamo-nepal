import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SearchModal } from "@/components/search/SearchModal";
import { CompareTray } from "@/components/common/CompareTray";
import { WhatsAppFloatingButton } from "@/components/common/WhatsAppFloatingButton";
import { BackToTopButton } from "@/components/common/BackToTopButton";
import { SkipToContent } from "@/components/common/SkipToContent";
import { DeliveryPromiseStrip } from "@/components/common/DeliveryPromiseStrip";
import { Toaster } from "sonner";
import "./globals.css";

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
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "GLAMO NEPAL — Premium Beauty & Cosmetics",
    template: "%s | GLAMO NEPAL",
  },
  description:
    "Shop premium beauty, cosmetics and personal care curated for Nepal. Authentic skincare, makeup, haircare and more at GLAMO NEPAL, Naya Baneshwor.",
  keywords: [
    "GLAMO NEPAL",
    "beauty Nepal",
    "cosmetics Kathmandu",
    "skincare Nepal",
    "makeup Nepal",
    "Nepal beauty ecommerce",
    "Khalti beauty",
    "eSewa beauty",
  ],
  openGraph: {
    title: "GLAMO NEPAL — Premium Beauty & Cosmetics",
    description:
      "Shop premium beauty, cosmetics and personal care curated for Nepal. Authentic skincare, makeup, haircare and more at GLAMO NEPAL, Naya Baneshwor.",
    url: "https://glamonepal.com",
    siteName: "GLAMO NEPAL",
    type: "website",
    locale: "en_NP",
  },
  twitter: {
    card: "summary_large_image",
    title: "GLAMO NEPAL — Premium Beauty & Cosmetics",
    description:
      "Shop premium beauty, cosmetics and personal care curated for Nepal.",
  },
  metadataBase: new URL("https://glamonepal.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body className="min-h-screen bg-brand-bgLight font-sans text-foreground antialiased">
        <SkipToContent />
        <AnnouncementBar />
        <Navbar />
        <DeliveryPromiseStrip />
        <main id="main-content">{children}</main>
        <Footer />
        <MobileBottomNav />
        <CartDrawer />
        <SearchModal />
        <CompareTray />
        <WhatsAppFloatingButton />
        <BackToTopButton />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}