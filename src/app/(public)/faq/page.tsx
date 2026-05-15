import Link from "next/link";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/common/PageHeader";
import { SITE_CONFIG } from "@/lib/config";
import { createMetadata, faqJsonLd } from "@/lib/seo";
import { FAQ_ITEMS } from "@/lib/data/faq";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = createMetadata({
  title: "Frequently Asked Questions",
  description: "Find answers about GLAMO NEPAL products, payments, COD, delivery and returns.",
  path: "/faq",
  keywords: ["FAQ", "GLAMO NEPAL FAQ", "delivery Nepal", "COD Nepal", "skincare FAQ"],
});

export default function FaqPage() {
  return (
    <main className="bg-neutral-50">
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />
      <PageHeader eyebrow="FAQ" title="Frequently asked questions" description="Clear answers for shoppers about products, delivery, payments and customer care." />
      <section className="container mx-auto grid gap-8 px-4 py-12 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="border border-neutral-200 bg-white p-6 lg:self-start">
          <HelpCircle className="text-primary" strokeWidth={1.5} />
          <h2 className="mt-4 font-display text-3xl font-semibold text-neutral-900">Need a custom answer?</h2>
          <p className="mt-3 text-sm leading-6 text-neutral-500">For order support, product confirmation or care guidance, contact GLAMO NEPAL directly.</p>
          <Link href={SITE_CONFIG.whatsapp} rel="noopener noreferrer" className="mt-6 inline-flex cursor-pointer items-center gap-2 bg-[#25D366] px-6 py-3 text-sm font-bold text-white transition-colors">
            <MessageCircle size={17} strokeWidth={1.5} /> Chat on WhatsApp
          </Link>
        </aside>
        <Accordion type="single" collapsible className="border border-neutral-200 bg-white p-4 md:p-6">
          {FAQ_ITEMS.map(({ question, answer }, index) => (
            <AccordionItem key={question} value={`q${index}`}>
              <AccordionTrigger className="text-left font-display text-xl font-semibold text-neutral-900">{question}</AccordionTrigger>
              <AccordionContent className="text-sm leading-7 text-neutral-500">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
}