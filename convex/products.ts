import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    search: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    brandId: v.optional(v.id("brands")),
    isActive: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    const page = args.page ?? 1;

    let products = await ctx.db.query("products").collect();

    if (args.search) {
      const s = args.search.toLowerCase();
      products = products.filter(
        (p) => p.name.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s))
      );
    }
    if (args.categoryId) products = products.filter((p) => p.categoryId === args.categoryId);
    if (args.brandId) products = products.filter((p) => p.brandId === args.brandId);
    if (args.isActive !== undefined) products = products.filter((p) => p.isActive === args.isActive);
    if (args.isFeatured !== undefined) products = products.filter((p) => p.isFeatured === args.isFeatured);

    const total = products.length;
    const paged = products.slice((page - 1) * limit, page * limit);

    const enriched = await Promise.all(
      paged.map(async (p) => {
        const images = await ctx.db
          .query("productImages")
          .withIndex("productId", (q) => q.eq("productId", p._id))
          .collect();
        const variants = await ctx.db
          .query("productVariants")
          .withIndex("productId", (q) => q.eq("productId", p._id))
          .collect();
        const category = await ctx.db.get(p.categoryId);
        const brand = p.brandId ? await ctx.db.get(p.brandId) : null;
        return {
          ...p,
          id: p._id,
          category: category ? { id: category._id, name: category.name, slug: category.slug } : null,
          brand: brand ? { id: brand._id, name: brand.name, slug: brand.slug } : null,
          images: images.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => ({
            id: img._id,
            url: img.url,
            alt_text: img.altText,
            sort_order: img.sortOrder,
            is_primary: img.isPrimary ? 1 : 0,
          })),
          variants: variants.map((v) => ({
            id: v._id,
            name: v.name,
            sku: v.sku,
            price: v.price,
            sale_price: v.salePrice,
            stock_quantity: v.stockQuantity,
            attributes: v.attributes,
            is_active: v.isActive ? 1 : 0,
          })),
          created_at: new Date(p._creationTime).toISOString(),
          updated_at: new Date(p._creationTime).toISOString(),
        };
      })
    );

    return { products: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
});

export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const p = await ctx.db.get(args.id);
    if (!p) throw new Error("Product not found");

    const images = await ctx.db
      .query("productImages")
      .withIndex("productId", (q) => q.eq("productId", p._id))
      .collect();
    const variants = await ctx.db
      .query("productVariants")
      .withIndex("productId", (q) => q.eq("productId", p._id))
      .collect();
    const category = await ctx.db.get(p.categoryId);
    const brand = p.brandId ? await ctx.db.get(p.brandId) : null;

    return {
      ...p,
      id: p._id,
      category: category ? { id: category._id, name: category.name, slug: category.slug } : null,
      brand: brand ? { id: brand._id, name: brand.name, slug: brand.slug } : null,
      images: images.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => ({
        id: img._id,
        url: img.url,
        alt_text: img.altText,
        sort_order: img.sortOrder,
        is_primary: img.isPrimary ? 1 : 0,
      })),
      variants: variants.map((v) => ({
        id: v._id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        sale_price: v.salePrice,
        stock_quantity: v.stockQuantity,
        attributes: v.attributes,
        is_active: v.isActive ? 1 : 0,
      })),
      created_at: new Date(p._creationTime).toISOString(),
      updated_at: new Date(p._creationTime).toISOString(),
    };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const p = await ctx.db
      .query("products")
      .withIndex("slug", (q) => q.eq("slug", args.slug))
      .first();
    if (!p) return null;

    const images = await ctx.db
      .query("productImages")
      .withIndex("productId", (q) => q.eq("productId", p._id))
      .collect();
    const variants = await ctx.db
      .query("productVariants")
      .withIndex("productId", (q) => q.eq("productId", p._id))
      .collect();
    const category = await ctx.db.get(p.categoryId);
    const brand = p.brandId ? await ctx.db.get(p.brandId) : null;

    return {
      ...p,
      id: p._id,
      category: category ? { id: category._id, name: category.name, slug: category.slug } : null,
      brand: brand ? { id: brand._id, name: brand.name, slug: brand.slug } : null,
      images: images.sort((a, b) => a.sortOrder - b.sortOrder).map((img) => ({
        id: img._id,
        url: img.url,
        alt_text: img.altText,
        sort_order: img.sortOrder,
        is_primary: img.isPrimary ? 1 : 0,
      })),
      variants: variants.map((v) => ({
        id: v._id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        sale_price: v.salePrice,
        stock_quantity: v.stockQuantity,
        attributes: v.attributes,
        is_active: v.isActive ? 1 : 0,
      })),
      created_at: new Date(p._creationTime).toISOString(),
      updated_at: new Date(p._creationTime).toISOString(),
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    sku: v.optional(v.string()),
    categoryId: v.id("categories"),
    brandId: v.optional(v.id("brands")),
    basePrice: v.number(),
    salePrice: v.optional(v.number()),
    costPrice: v.optional(v.number()),
    currency: v.optional(v.string()),
    isFeatured: v.optional(v.boolean()),
    isDigital: v.optional(v.boolean()),
    trackInventory: v.optional(v.boolean()),
    stockQuantity: v.optional(v.number()),
    lowStockThreshold: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as any))
      .first();
    requireRole(profile, ["ADMIN", "SUPER_ADMIN"]);

    const productId = await ctx.db.insert("products", {
      name: args.name,
      slug: args.slug,
      description: args.description,
      shortDescription: args.shortDescription,
      sku: args.sku,
      categoryId: args.categoryId,
      brandId: args.brandId,
      basePrice: args.basePrice,
      salePrice: args.salePrice,
      costPrice: args.costPrice,
      currency: args.currency ?? "NPR",
      isActive: true,
      isFeatured: args.isFeatured ?? false,
      isDigital: args.isDigital ?? false,
      trackInventory: args.trackInventory ?? true,
      stockQuantity: args.stockQuantity ?? 0,
      lowStockThreshold: args.lowStockThreshold ?? 5,
      weight: undefined,
      dimensions: undefined,
      metaTitle: args.metaTitle,
      metaDescription: args.metaDescription,
      tags: args.tags,
    });

    await ctx.db.insert("auditLogs", {
      userId: identity.subject as any,
      action: "CREATE",
      entity: "products",
      entityId: productId,
    });

    return productId;
  },
});

export const update = mutation({
  args: {
    id: v.id("products"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    sku: v.optional(v.string()),
    categoryId: v.optional(v.id("categories")),
    brandId: v.optional(v.id("brands")),
    basePrice: v.optional(v.number()),
    salePrice: v.optional(v.number()),
    costPrice: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    isDigital: v.optional(v.boolean()),
    trackInventory: v.optional(v.boolean()),
    stockQuantity: v.optional(v.number()),
    lowStockThreshold: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as any))
      .first();
    requireRole(profile, ["ADMIN", "SUPER_ADMIN"]);

    const { id, ...updates } = args;
    const cleaned = Object.fromEntries(Object.entries(updates).filter(([_, v]) => v !== undefined));
    await ctx.db.patch(id, cleaned);

    await ctx.db.insert("auditLogs", {
      userId: identity.subject as any,
      action: "UPDATE",
      entity: "products",
      entityId: id,
      changes: JSON.stringify(Object.entries(cleaned).map(([field, newValue]) => ({ field, newValue: String(newValue) }))),
    });

    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as any))
      .first();
    requireRole(profile, ["ADMIN", "SUPER_ADMIN"]);

    await ctx.db.delete(args.id);
    await ctx.db.insert("auditLogs", {
      userId: identity.subject as any,
      action: "DELETE",
      entity: "products",
      entityId: args.id,
    });
    return { message: "Product deleted" };
  },
});

export const toggleVisibility = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as any))
      .first();
    requireRole(profile, ["ADMIN", "SUPER_ADMIN"]);

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Product not found");
    await ctx.db.patch(args.id, { isActive: !product.isActive });
    return args.id;
  },
});

export const toggleFeatured = mutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as any))
      .first();
    requireRole(profile, ["ADMIN", "SUPER_ADMIN"]);

    const product = await ctx.db.get(args.id);
    if (!product) throw new Error("Product not found");
    await ctx.db.patch(args.id, { isFeatured: !product.isFeatured });
    return args.id;
  },
});

export const adjustStock = mutation({
  args: {
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    change: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    const previousStock = product.stockQuantity;
    const newStock = previousStock + args.change;
    if (newStock < 0) throw new Error(`Insufficient stock. Current: ${previousStock}, attempted change: ${args.change}`);

    await ctx.db.patch(args.productId, { stockQuantity: newStock });

    await ctx.db.insert("inventoryLogs", {
      productId: args.productId,
      variantId: args.variantId,
      changeType: args.change > 0 ? "RESTOCK" : "ADJUSTMENT",
      quantity: args.change,
      previousStock,
      newStock,
      reason: args.reason,
      performedBy: identity.subject as any,
    });

    return { message: "Stock adjusted", previousStock, newStock };
  },
});

function requireRole(profile: any, roles: string[]) {
  if (!profile || !roles.includes(profile.role)) {
    throw new Error("Insufficient permissions");
  }
  return profile;
}