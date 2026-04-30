import Link from "next/link";

const saleConfig = {
  festival: "Dashain",
  eyebrow: "Festival beauty edit",
  title: "Dashain glow sets are frontend-ready",
  description: "A data-driven banner component that can later switch to Tihar, Teej, wedding season or custom GLAMO campaigns.",
  cta: "Shop festival picks",
  href: "/shop?sort=best-sellers",
  badge: "Config driven",
};

export function DashainSaleBanner() {
  return (
    <section className="bg-brand-bgDark py-10 text-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-brand-primary via-brand-bgDark to-brand-bgDark p-8 md:p-12">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-gold/20 blur-3xl" />
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold">{saleConfig.eyebrow} · {saleConfig.festival}</p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl font-semibold md:text-5xl">{saleConfig.title}</h2>
          <p className="mt-4 max-w-2xl text-white/72">{saleConfig.description}</p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={saleConfig.href} className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-primary hover:bg-brand-bgLight">{saleConfig.cta}</Link>
            <span className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">{saleConfig.badge}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
