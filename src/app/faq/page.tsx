import Link from "next/link";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageHeader } from "@/components/common/PageHeader";
import { SITE_CONFIG } from "@/lib/constants";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Frequently Asked Questions",
  description: "Find answers about GLAMO NEPAL products, payments, COD, delivery and returns.",
  path: "/faq",
});

const faqs = [
  ["Where do you deliver?", "GLAMO NEPAL delivers inside Kathmandu Valley and to many locations across Nepal through available courier partners. Delivery availability is confirmed during checkout."],
  ["How long does Kathmandu Valley delivery take?", "Most Kathmandu Valley orders are prepared for delivery within 1 to 2 business days, depending on stock, address details and courier timing."],
  ["How long does outside-Valley delivery take?", "Outside-Valley orders usually take 3 to 5 business days after dispatch. Remote areas may require additional time."],
  ["Which payment methods are available?", "You can choose Khalti, eSewa, Cash on Delivery or Cards where those options are available for your order and location."],
  ["Is Cash on Delivery available?", "Cash on Delivery depends on district, order value and courier coverage. The checkout page shows availability before you place an order."],
  ["Are products authentic?", "GLAMO NEPAL curates beauty products with authenticity, clear product information and careful sourcing in mind."],
  ["Can I return a product?", "Returns are considered within 7 days for eligible unused, unopened and sealed products. Beauty and hygiene items may have restrictions once opened."],
  ["What if an item arrives damaged or incorrect?", "Contact GLAMO NEPAL as soon as possible with your order details and clear photos so the support team can review the issue."],
  ["Do you offer gift wrapping?", "Gift wrapping is available from checkout when the service is offered for your order."],
  ["How do I choose products for sensitive skin?", "Review ingredients, patch test new products and avoid items with known triggers. For medical skin concerns, consult a qualified professional."],
  ["Can I pick up from the store?", `Store pickup may be available from ${SITE_CONFIG.address}. Contact the team before visiting to confirm timing.`],
  ["Can I chat on WhatsApp?", `Yes. Use the floating WhatsApp button or message GLAMO NEPAL at ${SITE_CONFIG.phone}.`],
];

export default function FaqPage() {
  return (
    <main className="bg-brand-bgLight">
      <PageHeader eyebrow="FAQ" title="Frequently asked questions" description="Clear answers for shoppers about products, delivery, payments and customer care." />
      <section className="container mx-auto grid gap-8 px-4 py-12 md:px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <aside className="rounded-[2rem] border border-border/70 bg-white p-6 shadow-sm lg:self-start">
          <HelpCircle className="text-brand-primary" />
          <h2 className="mt-4 font-serif text-3xl font-semibold text-brand-textPrimary">Need a custom answer?</h2>
          <p className="mt-3 text-sm leading-6 text-brand-textMuted">For order support, product confirmation or care guidance, contact GLAMO NEPAL directly.</p>
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
