import { describe, it, expect } from "vitest";
import { adaptApiProduct, adaptApiProducts } from "@/lib/api/product-adapter";

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
  tags: ["Hydration", "K-Beauty", "made-in-nepal"],
  images: [
    { url: "/img/secondary.jpg", isPrimary: false },
    { url: "/img/primary.jpg", isPrimary: true },
  ],
  variants: [{ name: "Rose", attributes: { hex: "#ff0000" }, stockQuantity: 5 }],
  reviewSummary: { avgRating: 4.8, count: 421 },
};

describe("adaptApiProduct", () => {
  it("maps core backend fields to the storefront Product shape", () => {
    const p = adaptApiProduct(backendProduct)!;
    expect(p.id).toBe("prod-1");
    expect(p.name).toBe("COSRX Snail Mucin Essence");
    expect(p.slug).toBe("cosrx-snail-mucin-essence");
    expect(p.sku).toBe("GLM-COSRX-1");
    expect(p.brand).toBe("COSRX");
    expect(p.category).toBe("skincare");
    expect(p.description).toBe("A hydrating Korean essence.");
  });

  it("uses sale price as price and base price as originalPrice when discounted", () => {
    const p = adaptApiProduct(backendProduct)!;
    expect(p.price).toBe(2890);
    expect(p.originalPrice).toBe(3250);
  });

  it("has no originalPrice when there is no discount", () => {
    const p = adaptApiProduct({ ...backendProduct, salePrice: null })!;
    expect(p.price).toBe(3250);
    expect(p.originalPrice).toBeUndefined();
  });

  it("selects the primary image and maps gallery urls sorted by isPrimary", () => {
    const p = adaptApiProduct(backendProduct)!;
    expect(p.image).toBe("/img/primary.jpg");
    expect(p.images).toEqual(["/img/primary.jpg", "/img/secondary.jpg"]);
  });

  it("maps review summary, stock, tags and madeInNepal", () => {
    const p = adaptApiProduct(backendProduct)!;
    expect(p.rating).toBe(4.8);
    expect(p.reviewsCount).toBe(421);
    expect(p.stockCount).toBe(36);
    expect(p.inStock).toBe(true);
    expect(p.concernTags).toEqual(["Hydration", "K-Beauty", "made-in-nepal"]);
    expect(p.madeInNepal).toBe(true);
  });

  it("marks out-of-stock products", () => {
    const p = adaptApiProduct({ ...backendProduct, stockQuantity: 0 })!;
    expect(p.inStock).toBe(false);
    expect(p.stockCount).toBe(0);
  });

  it("derives shade options from variants", () => {
    const p = adaptApiProduct(backendProduct)!;
    expect(p.shadeOptions).toEqual([{ name: "Rose", hex: "#ff0000", stockCount: 5 }]);
  });

  it("transforms minimal input into a full Product with defaults", () => {
    const minimal = { id: "m1", name: "Min", slug: "min", basePrice: 500, stockQuantity: 2 };
    const p = adaptApiProduct(minimal)!;
    expect(p.price).toBe(500);
    expect(p.brand).toBe("GLAMO");
    expect(p.rating).toBe(0);
    expect(p.concernTags).toEqual([]);
  });

  it("returns null for invalid input", () => {
    expect(adaptApiProduct(null)).toBeNull();
    expect(adaptApiProduct(undefined)).toBeNull();
    expect(adaptApiProduct({})).toBeNull();
    expect(adaptApiProduct({ id: 123 })).toBeNull();
  });
});

describe("adaptApiProducts", () => {
  it("maps an array of backend products", () => {
    const list = adaptApiProducts([backendProduct, { ...backendProduct, id: "prod-2" }]);
    expect(list).toHaveLength(2);
    expect(list[1].id).toBe("prod-2");
  });

  it("returns an empty array for non-array input", () => {
    expect(adaptApiProducts(null)).toEqual([]);
    expect(adaptApiProducts(undefined)).toEqual([]);
  });
});