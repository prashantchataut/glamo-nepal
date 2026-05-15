"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
import { ComponentErrorBoundary } from "@/components/common/ComponentErrorBoundary";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd } from "@/lib/seo";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const isAdminRoute = pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <>
        <main id="main-content" className="min-h-screen bg-brand-bgLight">
          {children}
        </main>
        <Toaster richColors position="top-center" />
      </>
    );
  }

  return (
    <>
      <SkipToContent />
      <JsonLd data={organizationJsonLd()} />
      <AnnouncementBar />
      <Navbar />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={pathname}
          id="main-content"
          className="min-h-screen pt-[var(--total-header-height)] pb-20 md:pb-0"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {children}
        </motion.main>
      </AnimatePresence>
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
    </>
  );
}