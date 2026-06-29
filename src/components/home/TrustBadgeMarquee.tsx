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
  return (
    <div
      className="bg-primary text-neutral-50 py-3 border-y border-brand-primary/20"
      role="region"
      aria-label="Trust badges"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
          {TRUST_BADGES.map((badge) => {
            const iconName = iconMap[badge.icon] || "cruelty-free";
            return (
              <div key={badge.text} className="flex items-center gap-2.5">
                <span className="p-1.5 bg-white/10 rounded-full">
                  <TrustIcon name={iconName} size={16} />
                </span>
                <span className="font-medium tracking-[0.06em] text-xs sm:text-sm uppercase whitespace-nowrap">
                  {badge.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}