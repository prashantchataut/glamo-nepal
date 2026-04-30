import type { ReactNode } from "react";
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

export const metadata = defaultMetadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-brand-bgLight font-sans text-brand-textPrimary antialiased">
        <SkipToContent />
        <JsonLd data={organizationJsonLd()} />
        <AnnouncementBar />
        <Navbar />
        <main id="main-content" className="min-h-screen pb-20 md:pb-0">
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
