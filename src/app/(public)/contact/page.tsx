import Image from "next/image";
import ContactClient from "./ContactClient";
import { IMAGES } from "@/lib/image-library";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Contact", description: "Contact GLAMO Nepal for order support, beauty questions, store visit details and partnership inquiries.", path: "/contact" });

export default function ContactPage() {
  return (
    <main className="bg-neutral-50 pb-20 md:pb-0">
      <section className="border-b border-neutral-200 bg-neutral-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:px-6 md:py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8">
          <div>
            <p className="type-label text-primary">Customer care</p>
            <h1 className="mt-4 max-w-3xl font-display text-5xl font-medium leading-[0.95] tracking-[-0.02em] text-neutral-900 md:text-7xl">We are here for the details.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600">Ask about an order, get help choosing a product, confirm delivery coverage or plan a store visit in Kathmandu.</p>
          </div>
          <div className="relative min-h-[360px] overflow-hidden border border-neutral-200 bg-white shadow-editorial md:min-h-[460px]">
            <Image src={IMAGES.auth.loginSplit} alt="Beauty editorial support visual" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" />
          </div>
        </div>
      </section>
      <ContactClient />
    </main>
  );
}
