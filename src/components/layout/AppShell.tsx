"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <>
        {children}
        <Toaster richColors position="top-center" />
      </>
    );
  }

  return (
    <>
      <SkipToContent />
      <AnnouncementBar />
      <Navbar />
      <main id="main-content" className="min-h-screen pb-16 md:pb-0">
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
    </>
  );
}
