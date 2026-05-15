"use client";

import { TrustIcon, TrustIconName } from "@/components/ui/illustrations/TrustIcons";
import { TRUST_BADGES } from "@/lib/constants";

const iconMap: Record<string, TrustIconName> = {
  heart: "cruelty-free",
  shield: "authentic",
  sparkles: "dermatologist",
  leaf: "vegan",
  award: "safe-skin",
};

export function TrustBadgeMarquee() {
  const doubled = [...TRUST_BADGES, ...TRUST_BADGES, ...TRUST_BADGES, ...TRUST_BADGES];

  return (
    <div className="bg-brand-primary text-white py-3.5 overflow-hidden relative border-y border-brand-primary/20" role="marquee" aria-label="Trust badges">
      <div className="flex whitespace-nowrap">
        <div className="animate-marquee-scroll flex items-center gap-16 md:gap-24 px-8" aria-hidden="true">
          {doubled.map((badge, i) => {
            const iconName = iconMap[badge.icon] || "cruelty-free";
            return (
              <div key={`badge-${i}`} className="flex items-center gap-3">
                <span className="p-2 bg-white/10 rounded-full">
                  <TrustIcon name={iconName} size={16} />
                </span>
                <span className="font-label font-medium tracking-[0.08em] text-xs md:text-sm uppercase">{badge.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}