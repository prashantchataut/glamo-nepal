"use client";
// Client component required: route-aware chrome, route transitions, overlays, and stores.
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
export function AppShell({ children }: { children: ReactNode }) { const pathname = usePathname(); const reduceMotion = useReducedMotion(); const isAdminRoute = pathname?.startsWith("/admin"); if (isAdminRoute) return <>{children}<Toaster richColors position="top-center" /></>; return <><SkipToContent /><AnnouncementBar /><Navbar /><AnimatePresence mode="wait" initial={false}><motion.main key={pathname} id="main-content" className="min-h-screen pb-[calc(var(--mobile-nav-height)+32px)] md:pb-0" initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }} transition={{ duration: 0.2, ease: "easeOut" }}>{children}</motion.main></AnimatePresence><Footer /><CartDrawer /><SearchModal /><CompareTray /><WhatsAppFloatingButton /><BackToTopButton /><MobileBottomNav /><Toaster richColors position="top-center" /></>; }
