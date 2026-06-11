"use client";
import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { SITE_CONFIG } from "@/lib/config";

export function WhatsAppFloatingButton() {
  const pathname = usePathname();
  if (pathname?.startsWith("/checkout")) return null;
  const isProductPage = pathname?.startsWith("/product/");
  const label = isProductPage ? "Ask about this product" : "Chat with us";
  const href = isProductPage ? `${SITE_CONFIG.whatsapp}?text=${encodeURIComponent("Hi GLAMO, I have a question about this product.")}` : SITE_CONFIG.whatsapp;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group fixed bottom-20 right-4 z-whatsapp inline-flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg shadow-emerald-900/20 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp focus-visible:ring-offset-2 cursor-pointer md:bottom-24 md:right-6 md:h-14 md:w-14"
      aria-label={label}
    >
      <span className="absolute inset-0 rounded-full bg-whatsapp opacity-35 motion-safe:animate-ping" aria-hidden="true" />
      <MessageCircle className="relative z-10" size={24} />
      <span className="pointer-events-none absolute bottom-full right-0 mb-3 hidden whitespace-nowrap rounded-full bg-neutral-950 px-4 py-2 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 md:block" aria-hidden="true">
        {label}
      </span>
    </a>
  );
}