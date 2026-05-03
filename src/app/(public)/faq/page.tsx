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
    <main className="bg-brand-bgLight">
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />
      <PageHeader eyebrow="FAQ" title="Frequently asked questions" description="Clear answers for shoppers about products, delivery, payments and customer care." />
      <section className="container mx-auto grid gap-8 px-4 py-12 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm lg:self-start">
          <HelpCircle className="text-brand-primary" />
          <h2 className="mt-4 font-serif text-3xl font-semibold text-brand-textPrimary">Need a custom answer?</h2>
          <p className="mt-3 text-sm leading-6 text-brand-textMuted">For order support, product confirmation or care guidance, contact GLAMO NEPAL directly.</p>
          <Link href={SITE_CONFIG.whatsapp} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-semibold text-white"><MessageCircle size={17} /> Chat on WhatsApp</Link>
        </aside>
        <Accordion type="single" collapsible className="rounded-[2rem] border border-border/70 bg-white p-4 shadow-sm md:p-6">
          {FAQ_ITEMS.map(({ question, answer }, index) => (
            <AccordionItem key={question} value={`q${index}`}>
              <AccordionTrigger className="text-left font-serif text-xl font-semibold text-brand-textPrimary">{question}</AccordionTrigger>
              <AccordionContent className="text-sm leading-7 text-brand-textMuted">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
}