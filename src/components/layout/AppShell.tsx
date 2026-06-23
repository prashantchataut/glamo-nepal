"use client";

import { type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloatingButton } from "@/components/common/WhatsAppFloatingButton";
import { BackToTopButton } from "@/components/common/BackToTopButton";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SkipToContent } from "@/components/common/SkipToContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, webSiteJsonLd } from "@/lib/seo";


const CartDrawer = dynamic(
  () =>
    import("@/components/cart/CartDrawer").then((m) => ({
      default: m.CartDrawer,
    })),
  { ssr: false }
);
const SearchModal = dynamic(
  () =>
    import("@/components/search/SearchModal").then((m) => ({
      default: m.SearchModal,
    })),
  { ssr: false }
);
const CompareTray = dynamic(
  () =>
    import("@/components/common/CompareTray").then((m) => ({
      default: m.CompareTray,
    })),
  { ssr: false }
);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <>
        <main id="main-content" className="min-h-screen bg-neutral-50">
          {children}
        </main>
<Toaster position="top-center" toastOptions={{ duration: 3500, style: { borderRadius: '1rem', padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, boxShadow: 'var(--shadow-toast)', maxWidth: '420px', width: 'auto' } }} />
      </>
    );
  }

  return (
    <>
      <SkipToContent />
      <JsonLd data={[organizationJsonLd(), webSiteJsonLd()]} />
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" className="min-h-screen pb-16 md:pb-0">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <SearchModal />
      <CompareTray />
      <MobileBottomNav />
      <WhatsAppFloatingButton />
      <BackToTopButton />
      <Toaster position="top-center" toastOptions={{ duration: 3500, style: { borderRadius: '1rem', padding: '0.75rem 1.25rem', fontSize: '0.875rem', fontWeight: 500, boxShadow: 'var(--shadow-toast)', maxWidth: '420px', width: 'auto' } }} />
    </>
  );
}