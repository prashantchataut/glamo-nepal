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

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function isFuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase().trim();
  if (t.includes(q)) return true;
  const threshold = q.length <= 5 ? 2 : 3;
  const words = t.split(/\s+/);
  return words.some((word) => levenshteinDistance(q, word) <= threshold);
}

export function getSearchSuggestions(query: string, limit = 8): SearchSuggestion[] {
  const normalized = query.trim().toLowerCase();
  const suggestions: SearchSuggestion[] = [];

  const add = (suggestion: SearchSuggestion) => {
    if (!suggestions.some((item) => item.href === suggestion.href && item.label === suggestion.label)) suggestions.push(suggestion);
  };

  if (normalized.length >= 2) {
    const tokens = tokenize(query);

    const fuzzyMatchProducts = PRODUCTS.map((product) => {
      const searchable = [product.name, product.brand, product.sku, product.category, product.subCategory, ...product.concernTags].join(" ").toLowerCase();
      const isExact = tokens.every((token) => searchable.includes(token));
      const isFuzzy = isExact || tokens.every((token) => isFuzzyMatch(token, searchable));
      return { product, isExact, isFuzzy };
    }).filter((item) => item.isFuzzy)
      .sort((a, b) => (b.isExact ? 1 : 0) - (a.isExact ? 1 : 0))
      .slice(0, 4);

    fuzzyMatchProducts.forEach((item) => add({ label: item.product.name, href: `/products/${item.product.slug}`, type: "product" }));

    const fuzzyMatchBrands = Array.from(new Set(PRODUCTS.map((product) => product.brand)))
      .map((brand) => {
        const isExact = matchesAnyToken(brand, tokens);
        const isFuzzy = isExact || tokens.some((token) => isFuzzyMatch(token, brand));
        return { brand, isExact, isFuzzy };
      })
      .filter((item) => item.isFuzzy)
      .sort((a, b) => (b.isExact ? 1 : 0) - (a.isExact ? 1 : 0))
      .slice(0, 3);

    fuzzyMatchBrands.forEach((item) => add({ label: item.brand, href: `/shop?brands=${encodeURIComponent(item.brand)}`, type: "brand" }));

    CATEGORIES.filter((category) => matchesAnyToken(category.name, tokens) || category.subCategories.some((sub) => matchesAnyToken(sub, tokens)) || tokens.some((token) => isFuzzyMatch(token, category.name)) || category.subCategories.some((sub) => tokens.some((token) => isFuzzyMatch(token, sub))))
      .forEach((category) => add({ label: category.name, href: `/shop?category=${category.slug}`, type: "category" }));

    Array.from(new Set(PRODUCTS.flatMap((product) => product.concernTags)))
      .filter((concern) => matchesAnyToken(concern, tokens) || tokens.some((token) => isFuzzyMatch(token, concern)))
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