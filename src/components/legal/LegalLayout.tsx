import Link from "next/link";
import { SITE_CONFIG } from "@/lib/config";

export interface LegalSection {
  id: string;
  title: string;
  body: string[];
}

export function LegalLayout({ title, description, sections }: { title: string; description: string; sections: LegalSection[] }) {
  return (
    <main className="bg-brand-bgLight">
      <section className="relative overflow-hidden border-b border-brand-border bg-[linear-gradient(135deg,#FFF9F7_0%,#F8EEF2_50%,#F7F1EA_100%)] py-12 md:py-16">
        <div className="container mx-auto px-4 text-center md:px-6">
          <p className="font-label text-xs font-bold uppercase tracking-[0.24em] text-brand-primary">GLAMO NEPAL policy</p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-brand-textPrimary md:text-6xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-brand-textMuted md:text-base">{description}</p>
        </div>
      </section>
      <div className="container mx-auto grid gap-8 px-4 py-10 md:px-6 lg:grid-cols-[18rem_1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <nav className="rounded-none border border-border/70 bg-cream-50 p-4 shadow-sm" aria-label={`${title} sections`}>
            <p className="font-label px-3 pb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-gold">On this page</p>
            <div className="grid gap-1">
              {sections.map((section) => (
                <Link key={section.id} href={`#${section.id}`} className="rounded-none px-3 py-2 text-sm font-semibold text-brand-textMuted transition hover:bg-brand-bgLight hover:text-brand-primary">
                  {section.title}
                </Link>
              ))}
            </div>
          </nav>
          <div className="mt-4 rounded-none border border-border/70 bg-cream-50 p-5 text-sm leading-6 text-brand-textMuted shadow-sm">
            <p className="font-semibold text-brand-textPrimary">Need help?</p>
            <p className="mt-2">Contact {SITE_CONFIG.phone} or visit {SITE_CONFIG.address}.</p>
          </div>
        </aside>
        <article className="rounded-none border border-border/70 bg-cream-50 p-6 shadow-sm md:p-8">
          <p className="text-sm font-semibold text-brand-textMuted">Last updated: April 2026</p>
          <div className="mt-8 space-y-10">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="font-display text-3xl font-semibold text-brand-textPrimary">{section.title}</h2>
                <div className="mt-4 space-y-4 text-sm leading-7 text-brand-textMuted md:text-base">
                  {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
