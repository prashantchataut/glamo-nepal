"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PRODUCTS } from "@/lib/data/products";
import { formatNPR } from "@/lib/utils";

const skinTypes = ["Oily", "Dry", "Combination", "Sensitive"];
const concerns = ["Brightening", "Hydration", "Oil Control", "Acne Care", "Sun Protection", "Barrier Repair"];

export function BeautyProfileQuiz() {
  const [skinType, setSkinType] = useState("Combination");
  const [concern, setConcern] = useState("Hydration");
  const picks = useMemo(() => PRODUCTS.filter((p) => p.skinType.includes(skinType) && p.concernTags.includes(concern)).slice(0, 3), [skinType, concern]);
  const fallbackPicks = useMemo(() => {
    if (picks.length > 0) return picks;
    return PRODUCTS.filter((p) => p.skinType.includes(skinType) || p.concernTags.includes(concern)).slice(0, 3);
  }, [picks, skinType, concern]);

  const displayPicks = picks.length > 0 ? picks : fallbackPicks;

  return (
    <section className="bg-brand-surfacePink py-16 md:py-24" aria-labelledby="beauty-quiz-heading">
      <div className="container mx-auto grid gap-8 px-4 md:grid-cols-[0.8fr_1.2fr] md:px-6">
        <div>
          <p className="font-label flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary"><Sparkles size={16} aria-hidden="true" /> Beauty finder</p>
          <h2 id="beauty-quiz-heading" className="mt-3 font-display text-4xl font-semibold text-brand-textPrimary md:text-5xl">Find a routine that suits your skin</h2>
          <p className="mt-4 max-w-md text-base leading-7 text-brand-textMuted">
            Choose your skin type and current concern to discover a few polished product suggestions from the GLAMO edit.
          </p>
        </div>
        <div className="rounded-none border border-black/5 bg-cream-50 p-6 shadow-sm md:p-7">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-brand-textPrimary" htmlFor="quiz-skin-type">
              Skin type
              <select id="quiz-skin-type" value={skinType} onChange={(e) => setSkinType(e.target.value)} className="w-full rounded-none border border-border bg-brand-surfacePink px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30">
                {skinTypes.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold text-brand-textPrimary" htmlFor="quiz-concern">
              Main concern
              <select id="quiz-concern" value={concern} onChange={(e) => setConcern(e.target.value)} className="w-full rounded-none border border-border bg-brand-surfacePink px-4 py-3 font-normal outline-none focus:ring-2 focus:ring-brand-primary/30">
                {concerns.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-6 grid gap-3" aria-live="polite">
            {displayPicks.length > 0 ? displayPicks.map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="flex items-center justify-between rounded-none bg-brand-surfacePink p-4 transition hover:bg-brand-primary-light">
                <div>
                  <p className="font-display text-lg font-semibold text-brand-textPrimary">{p.name}</p>
                  <p className="text-xs text-brand-textMuted">{p.brand} &middot; {p.concernTags.slice(0, 2).join(", ")}</p>
                </div>
                <span className="font-semibold tracking-tight text-brand-textPrimary">{formatNPR(p.price)}</span>
              </Link>
            )) : (
              <p className="text-sm text-brand-textMuted text-center py-4">No exact matches found. Try adjusting your preferences.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}