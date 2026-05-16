import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EditorialHero, EditorialSection } from "@/components/common/EditorialPage";
import { FAQ_ITEMS } from "@/lib/data/faq";
import { IMAGES } from "@/lib/image-library";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "FAQ", description: "Answers about delivery, payments, returns and product support at GLAMO Nepal.", path: "/faq" });

export default function FAQPage() {
  return (
    <main className="bg-cream-50">
      <EditorialHero eyebrow="Help center" title="Clear answers before you order." description="Everything customers ask most about delivery, payment, product authenticity, returns and shopping with GLAMO Nepal." image={IMAGES.hero.secondary} imageAlt="Luxury skincare flatlay" />
      <EditorialSection title="Frequently asked questions" description="If you still need help, message us on WhatsApp or use the contact page.">
        <Accordion type="single" collapsible className="border border-cream-200 bg-cream-50">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`} className="border-cream-200 px-5 md:px-8">
              <AccordionTrigger className="min-h-14 text-left font-display text-xl font-medium text-ink hover:text-brand-rose">{item.question}</AccordionTrigger>
              <AccordionContent className="pb-6 text-sm leading-7 text-cream-700">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </EditorialSection>
    </main>
  );
}
