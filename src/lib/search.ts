import { CATEGORIES, PRODUCTS, TRENDING_SEARCHES } from "@/lib/data/products";

export interface SearchSuggestion {
  label: string;
  href: string;
  type: "product" | "brand" | "category" | "concern" | "trending";
}

function tokenize(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

function matchesAnyToken(text: string, tokens: string[]): boolean {
  const lower = text.toLowerCase();
  return tokens.some((token) => lower.includes(token));
}

export function getSearchSuggestions(query: string, limit = 8): SearchSuggestion[] {
  const normalized = query.trim().toLowerCase();
  const suggestions: SearchSuggestion[] = [];

  const add = (suggestion: SearchSuggestion) => {
    if (!suggestions.some((item) => item.href === suggestion.href && item.label === suggestion.label)) suggestions.push(suggestion);
  };

  if (normalized.length >= 2) {
    const tokens = tokenize(query);

    PRODUCTS.filter((product) => {
      const searchable = [product.name, product.brand, product.sku, product.category, product.subCategory, ...product.concernTags].join(" ").toLowerCase();
      return tokens.every((token) => searchable.includes(token));
    })
      .slice(0, 4)
      .forEach((product) => add({ label: product.name, href: `/product/${product.slug}`, type: "product" }));

    Array.from(new Set(PRODUCTS.map((product) => product.brand)))
      .filter((brand) => matchesAnyToken(brand, tokens))
      .slice(0, 3)
      .forEach((brand) => add({ label: brand, href: `/shop?brands=${encodeURIComponent(brand)}`, type: "brand" }));

    CATEGORIES.filter((category) => matchesAnyToken(category.name, tokens) || category.subCategories.some((sub) => matchesAnyToken(sub, tokens)))
      .forEach((category) => add({ label: category.name, href: `/shop?category=${category.slug}`, type: "category" }));

    Array.from(new Set(PRODUCTS.flatMap((product) => product.concernTags)))
      .filter((concern) => matchesAnyToken(concern, tokens))
      .slice(0, 3)
      .forEach((concern) => add({ label: concern, href: `/shop?concerns=${encodeURIComponent(concern)}`, type: "concern" }));
  }

  TRENDING_SEARCHES.slice(0, 6).forEach((term) => add({ label: term, href: `/search?q=${encodeURIComponent(term)}`, type: "trending" }));
  return suggestions.slice(0, limit);
}

export function getNoResultRecommendations(query: string, limit = 4) {
  const tokens = tokenize(query);
  const fallback = PRODUCTS.filter((product) => product.isBestSeller || product.isFeatured);

  if (tokens.length === 0) return fallback.slice(0, limit);

  const scored = PRODUCTS.map((product) => {
    let score = 0;
    const searchableFields = [
      product.name,
      product.brand,
      product.category,
      product.subCategory,
      product.description,
      ...product.concernTags,
      ...product.benefits,
    ];
    const combinedText = searchableFields.join(" ").toLowerCase();

    for (const token of tokens) {
      if (combinedText.includes(token)) score += 1;
    }
    if (product.isBestSeller) score += 0.5;
    if (product.isFeatured) score += 0.3;
    return { product, score };
  }).filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const results = scored.map((item) => item.product);
  return results.length > 0 ? results.slice(0, limit) : fallback.slice(0, limit);
}