/**
 * Shared checkout form styling.
 *
 * Consolidates the field/button classes that were previously duplicated as
 * local constants across ShippingStep, PaymentStep and DeliveryStep. Keeping
 * them in one place ensures consistent accessibility sizing, label treatment
 * and border-radius (rounded-xl for fields, rounded-[1.5rem] for section cards).
 *
 * NOTE: The previous label style used the banned "tiny uppercase tracked" pattern
 * (text-[11px] uppercase tracking-[0.16em]). Labels here use a plain readable
 * style instead — see frontend-design guidelines.
 */

export const checkoutInputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3.5 text-base text-neutral-950 placeholder:text-neutral-500 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 md:py-3 md:text-sm";

export const checkoutLabelClass =
  "mb-1.5 block text-sm font-medium text-neutral-600 md:mb-2";

export const checkoutErrorClass = "mt-1 text-xs text-error";

/** Compact secondary label used above grouped item lists (e.g. "Items (N)"). */
export const checkoutSectionLabelClass =
  "text-sm font-semibold text-neutral-500";

/**
 * Small accent label rendered above a heading. Replaces the banned
 * text-[11px] uppercase tracked eyebrow with a readable small-medium weight.
 */
export const checkoutEyebrowClass = "text-sm font-medium text-primary";
