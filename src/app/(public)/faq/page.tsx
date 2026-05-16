import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { EditorialHero, EditorialSection } from "@/components/common/EditorialPage";
import { FAQ_ITEMS } from "@/lib/data/faq";
import { IMAGES } from "@/lib/image-library";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "FAQ", description: "Answers about delivery, payments, returns and product support at GLAMO Nepal.", path: "/faq" });

export default function FAQPage() {
  return (
    <main className="bg-neutral-50">
      <EditorialHero eyebrow="Help center" title="Clear answers before you order." description="Everything customers ask most about delivery, payment, product authenticity, returns and shopping with GLAMO Nepal." image={IMAGES.hero.secondary} imageAlt="Luxury skincare flatlay" />
      <EditorialSection title="Frequently asked questions" description="If you still need help, message us on WhatsApp or use the contact page.">
        <Accordion type="single" collapsible className="border border-neutral-200 bg-white">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`} className="border-neutral-200 px-5 md:px-8">
              <AccordionTrigger className="min-h-14 text-left font-display text-xl font-medium text-neutral-900 hover:text-primary">{item.question}</AccordionTrigger>
              <AccordionContent className="pb-6 text-sm leading-7 text-neutral-600">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </EditorialSection>
    </main>
  );
}
