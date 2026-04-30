import type { Product } from "@/store/useCartStore";

export function getReturnEligibility(product: Product) {
  if (["makeup", "fragrance"].includes(product.category)) {
    return "Return eligible only if sealed, unused and reported within the approved policy window.";
  }
  if (product.category === "skincare" || product.category === "bodycare") {
    return "Unopened skincare/bodycare items may be eligible according to GLAMO return policy.";
  }
  return "Return eligibility depends on product condition and GLAMO return policy.";
}

export function getAuthenticityNote(product: Product) {
  return product.madeInNepal
    ? "Made in Nepal item selected for local beauty discovery. Check packaging and batch details on arrival."
    : "Curated product selection with authenticity-first sourcing standards.";
}

export function getBatchExpiryNote(product: Product) {
  return `${product.sku}: check batch number, manufacturing date and expiry date on the product package before use.`;
}

export function getPatchTestNote(product: Product) {
  if (["skincare", "bodycare", "haircare"].includes(product.category)) {
    return "Patch test before first use. Stop use if irritation occurs and consult a professional for persistent concerns.";
  }
  return "Check shade and finish on a small area where appropriate before full application.";
}
