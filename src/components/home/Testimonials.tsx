"use client";

import { useCallback, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    quote: "The best beauty store in Kathmandu. Every product I've bought has been authentic and arrives quickly.",
    name: "Priya Sharma",
    location: "Kathmandu",
    rating: 5,
  },
  {
    quote: "Finally, a place where I can trust the products are genuine. The skincare recommendations are spot on.",
    name: "Anita Thapa",
    location: "Lalitpur",
    rating: 5,
  },
  {
    quote: "Love the curated selection. It's so much better than guessing what works from random online stores.",
    name: "Sarah Rai",
    location: "Bhaktapur",
    rating: 4,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i < count ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          className={i < count ? "text-secondary" : "text-neutral-300"}
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollTo = useCallback((index: number) => {
    if (!scrollRef.current) return;
    const child = scrollRef.current.children[index] as HTMLElement;
    if (!child) return;
    scrollRef.current.scrollTo({
      left: child.offsetLeft - scrollRef.current.offsetLeft,
      behavior: "smooth",
    });
    setActiveIndex(index);
  }, []);

  return (
    <section className="bg-primary-dark py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
        <div className="text-center">
          <span className="type-label text-secondary/80 mb-3 block">
            Testimonials
          </span>
          <h2 className="type-display-md text-white">What Our Customers Say</h2>
        </div>

        {/* Desktop: 3 columns */}
        <div className="mt-12 hidden lg:grid grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="text-white">
              <StarRating count={t.rating} />
              <blockquote className="font-display text-xl italic text-white/90 mt-4 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6">
                <p className="text-white font-medium text-sm">{t.name}</p>
                <p className="text-white/50 text-sm">{t.location}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: Swipeable */}
        <div className="mt-12 lg:hidden">
          <div
            ref={scrollRef}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto no-scrollbar pb-4"
          >
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="min-w-[85vw] snap-center flex-shrink-0 text-white"
              >
                <StarRating count={t.rating} />
                <blockquote className="font-display text-lg italic text-white/90 mt-4 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="mt-6">
                  <p className="text-white font-medium text-sm">{t.name}</p>
                  <p className="text-white/50 text-sm">{t.location}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
              className="flex h-10 w-10 items-center justify-center border border-white/20 text-white transition-colors hover:bg-white/10"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollTo(i)}
                  className={cn(
                    "h-1.5 transition-all duration-300",
                    i === activeIndex
                      ? "w-8 bg-secondary"
                      : "w-1.5 bg-white/30"
                  )}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() =>
                scrollTo(Math.min(TESTIMONIALS.length - 1, activeIndex + 1))
              }
              className="flex h-10 w-10 items-center justify-center border border-white/20 text-white transition-colors hover:bg-white/10"
              aria-label="Next testimonial"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}