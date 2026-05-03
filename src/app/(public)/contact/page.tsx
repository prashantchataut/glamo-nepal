import { Suspense } from "react";
import { createMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import ContactClient from "./ContactClient";

export const metadata = createMetadata({
  title: "Contact GLAMO NEPAL",
  description: "Contact GLAMO NEPAL by phone, WhatsApp, Instagram or visit Naya Baneshwor, Mantra In & Out Square, Kathmandu.",
  path: "/contact",
  keywords: ["contact GLAMO NEPAL", "beauty store Kathmandu", "WhatsApp Nepal", "Nepal skincare contact"],
});

export default function ContactPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-bgLight" />}>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }])} />
      <ContactClient />
    </Suspense>
  );
}