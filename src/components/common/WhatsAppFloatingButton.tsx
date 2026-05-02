"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { SITE_CONFIG } from "@/lib/constants";

export function WhatsAppFloatingButton() {
  const pathname = usePathname();
  if (pathname?.startsWith("/checkout")) return null;
  return (
    <a href={SITE_CONFIG.whatsapp} target="_blank" rel="noopener noreferrer" className="group fixed bottom-20 right-4 z-whatsapp flex items-center gap-3 rounded-full bg-[#25D366] p-4 text-white shadow-2xl shadow-emerald-900/20 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 md:bottom-6 md:right-6" aria-label="Chat with us on WhatsApp">
      <MessageCircle size={24} />
      <span className="pointer-events-none absolute bottom-full right-0 mb-3 hidden whitespace-nowrap rounded-full bg-brand-bgDark px-4 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block">Chat with us on WhatsApp</span>
    </a>
  );
}