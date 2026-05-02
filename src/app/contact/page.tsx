import { Suspense } from "react";
import { createMetadata } from "@/lib/seo";
import ContactClient from "./ContactClient";

export const metadata = createMetadata({
  title: "Contact GLAMO NEPAL",
  description: "Contact GLAMO NEPAL by phone, WhatsApp, Instagram or visit Naya Baneshwor, Mantra In & Out Square, Kathmandu.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bgLight" />}>
      <ContactClient />
    </Suspense>
  );
}