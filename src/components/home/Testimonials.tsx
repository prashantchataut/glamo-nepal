import { Star } from "lucide-react";

const TESTIMONIALS = [
  { quote: "The site feels curated, not overwhelming. I found a gentle serum and knew exactly why it fit my routine.", name: "Priya", location: "Kathmandu" },
  { quote: "I care most about authenticity. GLAMO makes the shopping experience feel calm and trustworthy.", name: "Anisha", location: "Pokhara" },
  { quote: "The product pages are clear, the prices are in रू, and the delivery information is easy to understand.", name: "Srijana", location: "Lalitpur" },
];

export function Testimonials() {
  return (
    <section className="bg-neutral-900 py-16 text-neutral-50 md:py-24" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <h2 id="testimonials-heading" className="font-display text-4xl font-medium leading-[1.05] tracking-[-0.02em] md:text-5xl">Beauty shopping that feels easier.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
<article key={item.name} className="rounded-[1.5rem] border border-white/12 bg-white/5 p-6">
                <div className="flex gap-1 text-secondary" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, index) => <Star key={index} size={14} fill="currentColor" />)}
                </div>
                <blockquote className="mt-5 text-lg leading-snug text-neutral-50/90">&ldquo;{item.quote}&rdquo;</blockquote>
                <p className="mt-6 text-sm font-semibold text-neutral-50">{item.name}</p>
                <p className="mt-1 text-sm font-semibold text-neutral-50/40">{item.location}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
