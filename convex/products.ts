import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("products").order("desc").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    return products[0] ?? null;
  },
});

export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

export const getByBrand = query({
  args: { brandSlug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("products")
      .withIndex("by_brand", (q) => q.eq("brandSlug", args.brandSlug))
      .collect();
  },
});

export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("by_featured", (q) => q.eq("isFeatured", true))
      .collect();
  },
});

export const getBestSellers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("by_best_seller", (q) => q.eq("isBestSeller", true))
      .collect();
  },
});

export const getInStock = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("by_in_stock", (q) => q.eq("inStock", true))
      .collect();
  },
});

export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const q = args.query.toLowerCase();
    const maxResults = 50;
    const allProducts = await ctx.db.query("products").collect();
    const filtered = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subCategory.toLowerCase().includes(q) ||
        p.concernTags.some((t) => t.toLowerCase().includes(q)) ||
        p.skinType.some((t) => t.toLowerCase().includes(q))
    );
    return filtered.slice(0, maxResults);
  },
});

export const create = internalMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    sku: v.string(),
    brand: v.string(),
    brandSlug: v.string(),
    category: v.string(),
    subCategory: v.string(),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    mrp: v.optional(v.number()),
    image: v.string(),
    images: v.optional(v.array(v.string())),
    badge: v.optional(v.union(v.literal("Best Seller"), v.literal("New"), v.literal("Sale"), v.literal("Limited"))),
    rating: v.number(),
    reviewsCount: v.number(),
    reviewSummary: v.optional(
      v.object({
        average: v.number(),
        count: v.number(),
        highlights: v.array(v.string()),
      })
    ),
    skinType: v.array(v.string()),
    concernTags: v.array(v.string()),
    benefits: v.array(v.string()),
    howToUse: v.array(v.string()),
    ingredients: v.array(v.string()),
    size: v.string(),
    origin: v.string(),
    madeInNepal: v.boolean(),
    shadeOptions: v.optional(
      v.array(
        v.object({
          name: v.string(),
          hex: v.optional(v.string()),
          stockCount: v.optional(v.number()),
        })
      )
    ),
    stockCount: v.number(),
    inStock: v.boolean(),
    description: v.string(),
    deliveryNote: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
    isBestSeller: v.optional(v.boolean()),
    isNewArrival: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", args);
  },
});

export const update = internalMutation({
  args: {
    id: v.id("products"),
    ...v.object({
      name: v.optional(v.string()),
      slug: v.optional(v.string()),
      sku: v.optional(v.string()),
      brand: v.optional(v.string()),
      brandSlug: v.optional(v.string()),
      category: v.optional(v.string()),
      subCategory: v.optional(v.string()),
      price: v.optional(v.number()),
      originalPrice: v.optional(v.number()),
      mrp: v.optional(v.number()),
      image: v.optional(v.string()),
      images: v.optional(v.array(v.string())),
      badge: v.optional(v.union(v.literal("Best Seller"), v.literal("New"), v.literal("Sale"), v.literal("Limited"))),
      rating: v.optional(v.number()),
      reviewsCount: v.optional(v.number()),
      reviewSummary: v.optional(
        v.object({
          average: v.number(),
          count: v.number(),
          highlights: v.array(v.string()),
        })
      ),
      skinType: v.optional(v.array(v.string())),
      concernTags: v.optional(v.array(v.string())),
      benefits: v.optional(v.array(v.string())),
      howToUse: v.optional(v.array(v.string())),
      ingredients: v.optional(v.array(v.string())),
      size: v.optional(v.string()),
      origin: v.optional(v.string()),
      madeInNepal: v.optional(v.boolean()),
      shadeOptions: v.optional(
        v.array(
          v.object({
            name: v.string(),
            hex: v.optional(v.string()),
            stockCount: v.optional(v.number()),
          })
        )
      ),
      stockCount: v.optional(v.number()),
      inStock: v.optional(v.boolean()),
      description: v.optional(v.string()),
      deliveryNote: v.optional(v.string()),
      isFeatured: v.optional(v.boolean()),
      isBestSeller: v.optional(v.boolean()),
      isNewArrival: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const product = await ctx.db.get(id);
    if (!product) throw new Error("Product not found");
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});

export const remove = internalMutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Product not found");
    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const updateStock = internalMutation({
  args: {
    id: v.id("products"),
    stockCount: v.number(),
    shadeStock: v.optional(v.array(v.object({ name: v.string(), stockCount: v.number() }))),
  },
  handler: async (ctx, args) => {
    const { id, stockCount, shadeStock } = args;
    const product = await ctx.db.get(id);
    if (!product) throw new Error("Product not found");
    const updates: any = {
      stockCount,
      inStock: stockCount > 0,
    };
    if (shadeStock && product.shadeOptions) {
      updates.shadeOptions = product.shadeOptions.map((s) => {
        const match = shadeStock.find((ss) => ss.name === s.name);
        return match ? { ...s, stockCount: match.stockCount } : s;
      });
    }
    await ctx.db.patch(id, updates);
    return await ctx.db.get(id);
  },
});