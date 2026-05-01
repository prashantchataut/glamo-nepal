import type { ReactNode } from "react";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
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
        <SkipToContent />
        <JsonLd data={organizationJsonLd()} />
        <AnnouncementBar />
        <Navbar />
        <main id="main-content" className="min-h-screen pt-[var(--total-header-height)] pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <CartDrawer />
        <SearchModal />
        <CompareTray />
        <WhatsAppFloatingButton />
        <BackToTopButton />
        <MobileBottomNav />
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}