import { CATEGORIES, PRODUCTS, TRENDING_SEARCHES } from "@/lib/mock/products";

export interface SearchSuggestion {
  label: string;
  href: string;
  type: "product" | "brand" | "category" | "concern" | "trending";
}

export function getSearchSuggestions(query: string, limit = 8): SearchSuggestion[] {
  const normalized = query.trim().toLowerCase();
  const suggestions: SearchSuggestion[] = [];

  const add = (suggestion: SearchSuggestion) => {
    if (!suggestions.some((item) => item.href === suggestion.href && item.label === suggestion.label)) suggestions.push(suggestion);
  };

  if (normalized.length >= 2) {
    PRODUCTS.filter((product) => [product.name, product.brand, product.sku, product.category, product.subCategory, ...product.concernTags].join(" ").toLowerCase().includes(normalized))
      .slice(0, 4)
      .forEach((product) => add({ label: product.name, href: `/product/${product.slug}`, type: "product" }));

    Array.from(new Set(PRODUCTS.map((product) => product.brand)))
      .filter((brand) => brand.toLowerCase().includes(normalized))
      .slice(0, 3)
      .forEach((brand) => add({ label: brand, href: `/shop?brands=${encodeURIComponent(brand)}`, type: "brand" }));

    CATEGORIES.filter((category) => category.name.toLowerCase().includes(normalized) || category.subCategories.some((sub) => sub.toLowerCase().includes(normalized)))
      .forEach((category) => add({ label: category.name, href: `/shop?category=${category.slug}`, type: "category" }));

    Array.from(new Set(PRODUCTS.flatMap((product) => product.concernTags)))
      .filter((concern) => concern.toLowerCase().includes(normalized))
      .slice(0, 3)
      .forEach((concern) => add({ label: concern, href: `/shop?concerns=${encodeURIComponent(concern)}`, type: "concern" }));
  }

  TRENDING_SEARCHES.slice(0, 6).forEach((term) => add({ label: term, href: `/search?q=${encodeURIComponent(term)}`, type: "trending" }));
  return suggestions.slice(0, limit);
}

export function getNoResultRecommendations(query: string, limit = 4) {
  const normalized = query.toLowerCase();
  const fallback = PRODUCTS.filter((product) => product.isBestSeller || product.isFeatured);
  const concernMatches = PRODUCTS.filter((product) => product.concernTags.some((concern) => normalized.includes(concern.toLowerCase())));
  const categoryMatches = PRODUCTS.filter((product) => normalized.includes(product.category) || normalized.includes(product.subCategory.toLowerCase()));
  return Array.from(new Map([...concernMatches, ...categoryMatches, ...fallback].map((product) => [product.id, product])).values()).slice(0, limit);
}
