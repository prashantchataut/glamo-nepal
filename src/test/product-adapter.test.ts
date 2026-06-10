import { describe, it, expect } from "vitest";
import { adaptProduct, adaptProducts } from "@/lib/api/product-adapter";

// Mirrors the shape returned by backend formatProduct()
const backendProduct = {
  id: "prod-1",
  name: "COSRX Snail Mucin Essence",
  slug: "cosrx-snail-mucin-essence",
  description: "A hydrating Korean essence.",
  shortDescription: "Hydrating essence",
  sku: "GLM-COSRX-1",
  categoryId: "cat-1",
  categoryName: "Skincare",
  categorySlug: "skincare",
  brandId: "brand-1",
  brandName: "COSRX",
  brandSlug: "cosrx",
  basePrice: 3250,
  salePrice: 2890,
  costPrice: null,
  currency: "NPR",
  isActive: true,
  isFeatured: true,
  stockQuantity: 36,
  tags: ["Hydration", "K-Beauty", "Made in Nepal"],
  images: [
    { url: "/img/secondary.jpg", isPrimary: false, sortOrder: 1 },
    { url: "/img/primary.jpg", isPrimary: true, sortOrder: 0 },
  ],
  variants: [{ name: "Rose", attributes: { hex: "#ff0000" }, stockQuantity: 5 }],
  reviewSummary: { avgRating: 4.8, count: 421 },
};

describe("adaptProduct", () => {
  it("maps core backend fields to the storefront Product shape", () => {
    const p = adaptProduct(backendProduct);
    expect(p.id).toBe("prod-1");
    expect(p.name).toBe("COSRX Snail Mucin Essence");
    expect(p.slug).toBe("cosrx-snail-mucin-essence");
    expect(p.sku).toBe("GLM-COSRX-1");
    expect(p.brand).toBe("COSRX");
    expect(p.category).toBe("skincare");
    expect(p.description).toBe("A hydrating Korean essence.");
  });

  it("uses sale price as price and base price as originalPrice when discounted", () => {
    const p = adaptProduct(backendProduct);
    expect(p.price).toBe(2890);
    expect(p.originalPrice).toBe(3250);
    expect(p.badge).toBe("Sale");
  });

  it("has no originalPrice when there is no discount", () => {
    const p = adaptProduct({ ...backendProduct, salePrice: null });
    expect(p.price).toBe(3250);
    expect(p.originalPrice).toBeUndefined();
    expect(p.badge).toBe("Best Seller");
  });

  it("selects the primary image and maps gallery urls", () => {
    const p = adaptProduct(backendProduct);
    expect(p.image).toBe("/img/primary.jpg");
    expect(p.images).toEqual(["/img/secondary.jpg", "/img/primary.jpg"]);
  });

  it("maps review summary, stock, tags and madeInNepal", () => {
    const p = adaptProduct(backendProduct);
    expect(p.rating).toBe(4.8);
    expect(p.reviewsCount).toBe(421);
    expect(p.stockCount).toBe(36);
    expect(p.inStock).toBe(true);
    expect(p.concernTags).toEqual(["Hydration", "K-Beauty", "Made in Nepal"]);
    expect(p.madeInNepal).toBe(true);
  });

  it("marks out-of-stock products", () => {
    const p = adaptProduct({ ...backendProduct, stockQuantity: 0 });
    expect(p.inStock).toBe(false);
    expect(p.stockCount).toBe(0);
  });

  it("derives shade options from variants", () => {
    const p = adaptProduct(backendProduct);
    expect(p.shadeOptions).toEqual([{ name: "Rose", hex: "#ff0000", stockCount: 5 }]);
  });

  it("passes through objects that are already storefront products", () => {
    const existing = { id: "x", name: "Already", slug: "already", price: 100 };
    expect(adaptProduct(existing)).toBe(existing);
  });

  it("tolerates missing optional fields", () => {
    const minimal = { id: "m1", name: "Min", slug: "min", basePrice: 500, stockQuantity: 2 };
    const p = adaptProduct(minimal);
    expect(p.price).toBe(500);
    expect(p.image).toBe("");
    expect(p.rating).toBe(0);
    expect(p.concernTags).toEqual([]);
    expect(p.brand).toBe("");
  });
});

describe("adaptProducts", () => {
  it("maps an array of backend products", () => {
    const list = adaptProducts([backendProduct, { ...backendProduct, id: "prod-2" }]);
    expect(list).toHaveLength(2);
    expect(list[1].id).toBe("prod-2");
  });

  it("returns an empty array for non-array input", () => {
    expect(adaptProducts(null)).toEqual([]);
    expect(adaptProducts(undefined)).toEqual([]);
  });
});
