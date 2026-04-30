import Link from "next/link";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/common/PageHeader";
import { SITE_CONFIG } from "@/lib/constants";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Frequently Asked Questions",
  description: "Find answers about GLAMO NEPAL products, payments, COD, delivery, returns and launch-readiness.",
  path: "/faq",
});

const faqs = [
  ["Do you support Khalti and eSewa?", "The frontend shows Khalti, eSewa, Cash on Delivery and Cards. Real merchant credentials and backend payment verification are still required."],
  ["Is Cash on Delivery available?", "A reusable COD checker is included with mock district rules. Owner courier and COD rules must replace mock logic before production."],
  ["Are these products final?", "No. Product names, prices and categories are mock Nepal-market data. Product claims, ingredients, pricing and photos must be supplier-approved before launch."],
  ["Where is GLAMO NEPAL located?", SITE_CONFIG.address],
  ["Can I chat on WhatsApp?", `Yes, the floating WhatsApp button links to ${SITE_CONFIG.whatsapp}. It is hidden on checkout to reduce distraction.`],
  ["Are returns supported?", "The frontend includes draft policy pages and mock order UI. Final beauty-product return eligibility needs owner/legal approval."],
];

export default function FaqPage() {
  return (
    <main className="bg-brand-bgLight">
      <PageHeader eyebrow="FAQ" title="Frequently asked questions" description="Clear answers for shoppers and a transparent frontend handoff for the GLAMO NEPAL owner." />
      <section className="container mx-auto grid gap-8 px-4 py-12 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm lg:self-start">
          <HelpCircle className="text-brand-primary" />
          <h2 className="mt-4 font-serif text-3xl font-semibold text-brand-textPrimary">Need a custom answer?</h2>
          <p className="mt-3 text-sm leading-6 text-brand-textMuted">For order support, product confirmation or launch questions, contact GLAMO NEPAL directly.</p>
          <Link href={SITE_CONFIG.whatsapp} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-semibold text-white"><MessageCircle size={17} /> Chat on WhatsApp</Link>
        </aside>
        <Accordion type="single" collapsible className="rounded-[2rem] border border-border/70 bg-white p-4 shadow-sm md:p-6">
          {faqs.map(([question, answer], index) => (
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
