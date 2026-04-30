import type { Product } from "@/store/useCartStore";

export function getReturnEligibility(product: Product) {
  if (["makeup", "fragrance"].includes(product.category)) {
    return "Return eligible only if sealed, unused and reported within the approved policy window.";
  }
  if (product.category === "skincare" || product.category === "bodycare") {
    return "Unopened skincare/bodycare items only. Final policy requires owner/legal approval.";
  }
  return "Return eligibility depends on final GLAMO policy and supplier condition checks.";
}

export function getAuthenticityNote(product: Product) {
  return product.madeInNepal
    ? "Verify manufacturer, batch and MRP before publishing this Made in Nepal item."
    : "Confirm importer/distributor documentation before publishing this product.";
}

export function getBatchExpiryNote(product: Product) {
  return `${product.sku}: batch number, manufacture date and expiry date are required from supplier before launch.`;
}

export function getPatchTestNote(product: Product) {
  if (["skincare", "bodycare", "haircare"].includes(product.category)) {
    return "Patch test before first use. Stop use if irritation occurs and consult a professional for persistent concerns.";
  }
  return "Check shade/finish on a small area where appropriate. Product performance claims need supplier approval.";
}
