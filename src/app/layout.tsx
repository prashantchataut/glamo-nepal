import type { ReactNode } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SearchModal } from "@/components/search/SearchModal";
import { WhatsAppFloatingButton } from "@/components/common/WhatsAppFloatingButton";
import { BackToTopButton } from "@/components/common/BackToTopButton";
import { CompareTray } from "@/components/common/CompareTray";
import { SkipToContent } from "@/components/common/SkipToContent";
import { ComponentErrorBoundary } from "@/components/common/ComponentErrorBoundary";
import { JsonLd } from "@/components/seo/JsonLd";
import { defaultMetadata, organizationJsonLd } from "@/lib/seo";

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

export const metadata = defaultMetadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-brand-bgLight font-sans text-brand-textPrimary antialiased">
        <SkipToContent />
        <JsonLd data={organizationJsonLd()} />
        <AnnouncementBar />
        <Navbar />
        <main id="main-content" className="min-h-screen pt-[var(--total-header-height)] pb-20 md:pb-0">
          {children}
        </main>
        <Footer />
        <ComponentErrorBoundary name="CartDrawer">
          <CartDrawer />
        </ComponentErrorBoundary>
        <ComponentErrorBoundary name="SearchModal">
          <SearchModal />
        </ComponentErrorBoundary>
        <ComponentErrorBoundary name="CompareTray">
          <CompareTray />
        </ComponentErrorBoundary>
        <WhatsAppFloatingButton />
        <BackToTopButton />
        <MobileBottomNav />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}