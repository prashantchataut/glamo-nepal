const TESTIMONIALS = [
  { quote: "The site feels curated, not overwhelming. I found a gentle serum and knew exactly why it fit my routine.", name: "Priya", location: "Kathmandu" },
  { quote: "I care most about authenticity. GLAMO makes the shopping experience feel calm and trustworthy.", name: "Anisha", location: "Pokhara" },
  { quote: "The product pages are clear, the prices are in रू, and the delivery information is easy to understand.", name: "Srijana", location: "Lalitpur" },
];

export function Testimonials() {
  return (
    <section className="bg-ink py-16 text-white md:py-24" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <p className="type-label text-gold">Customer notes</p>
            <h2 id="testimonials-heading" className="mt-3 font-display text-5xl font-light leading-tight md:text-6xl">Beauty shopping that feels easier.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <article key={item.name} className="border border-white/15 p-6">
                <div className="flex gap-1 text-gold" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, index) => <span key={index}>★</span>)}
                </div>
                <blockquote className="mt-5 font-display text-2xl leading-snug text-white/90">“{item.quote}”</blockquote>
                <p className="mt-6 text-sm font-semibold text-white">{item.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/45">{item.location}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
