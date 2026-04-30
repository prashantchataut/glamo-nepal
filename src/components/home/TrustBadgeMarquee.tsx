"use client";

import { Leaf, ShieldCheck, Heart, Sparkles, Award } from "lucide-react";
import { TRUST_BADGES } from "@/lib/constants";

const iconMap: Record<string, React.ElementType> = {
  heart: Heart,
  shield: ShieldCheck,
  sparkles: Sparkles,
  leaf: Leaf,
  award: Award,
};

export function TrustBadgeMarquee() {
  const doubled = [...TRUST_BADGES, ...TRUST_BADGES, ...TRUST_BADGES, ...TRUST_BADGES];

  return (
    <div className="bg-brand-primary text-white py-3.5 overflow-hidden relative border-y border-brand-primary/20">
      <div className="flex whitespace-nowrap">
        <div className="animate-marquee-scroll flex items-center gap-16 md:gap-24 px-8">
          {doubled.map((badge, i) => {
            const Icon = iconMap[badge.icon];
            return (
              <div key={`badge-${i}`} className="flex items-center gap-3">
                <span className="p-2 bg-white/10 rounded-full">
                  {Icon && <Icon size={16} strokeWidth={1.5} />}
                </span>
                <span className="font-medium tracking-[0.08em] text-xs md:text-sm uppercase">{badge.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}