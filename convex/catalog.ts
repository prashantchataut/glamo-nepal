import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

function assertString(value: unknown, field: string, min = 1, max = 500) {
  if (typeof value !== "string" || value.length < min || value.length > max) {
    throw new Error(`${field} must be ${min}-${max} characters`);
  }
}

function assertEmail(value: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || value.length > 320) {
    throw new Error("Invalid email address");
  }
}

function assertNonNegative(value: number, field: string) {
  if (value < 0) throw new Error(`${field} must be non-negative`);
}

function assertRange(value: number, field: string, min: number, max: number) {
  if (value < min || value > max) throw new Error(`${field} must be ${min}-${max}`);
}

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();
    return categories
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ id: c._id, name: c.name, slug: c.slug, description: c.description, imageUrl: c.imageUrl, parentId: c.parentId }));
  },
});

export const getBrands = query({
  args: {},
  handler: async (ctx) => {
    const brands = await ctx.db.query("brands").collect();
    return brands
      .filter((b) => b.isActive)
      .map((b) => ({ id: b._id, name: b.name, slug: b.slug, description: b.description, logoUrl: b.logoUrl }));
  },
});

export const getBanners = query({
  args: { position: v.optional(v.string()), isActive: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let banners = await ctx.db.query("banners").collect();
    if (args.position) banners = banners.filter((b) => b.position === args.position);
    if (args.isActive !== undefined) banners = banners.filter((b) => b.isActive === args.isActive);
    const now = Date.now();
    banners = banners.filter((b) => {
      if (!b.isActive) return false;
      if (b.startsAt && b.startsAt > now) return false;
      if (b.expiresAt && b.expiresAt < now) return false;
      return true;
    });
    return banners
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((b) => ({
        id: b._id,
        title: b.title,
        subtitle: b.subtitle,
        imageUrl: b.imageUrl,
        linkUrl: b.linkUrl,
        position: b.position,
        sortOrder: b.sortOrder,
        isActive: b.isActive,
      }));
  },
});

export const submitContact = mutation({
  args: { name: v.string(), email: v.string(), phone: v.optional(v.string()), subject: v.string(), message: v.string() },
  handler: async (ctx, args) => {
    assertString(args.name, "name", 1, 200);
    assertEmail(args.email);
    if (args.phone) assertString(args.phone, "phone", 1, 30);
    assertString(args.subject, "subject", 1, 200);
    assertString(args.message, "message", 1, 5000);
    await ctx.db.insert("contactSubmissions", args);
    return { message: "Contact form submitted successfully" };
  },
});

export const subscribeNewsletter = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    assertEmail(args.email);
    const existing = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      if (existing.isActive) throw new Error("Already subscribed");
      await ctx.db.patch(existing._id, { isActive: true });
      return { message: "Re-subscribed successfully" };
    }
    const token = crypto.randomUUID();
    await ctx.db.insert("newsletterSubscribers", {
      email: args.email,
      isActive: true,
      unsubscribeToken: token,
    });
    return { message: "Subscribed successfully" };
  },
});

export const getCart = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();
  },
});

export const addToCart = mutation({
  args: { productId: v.id("products"), variantId: v.optional(v.id("productVariants")), quantity: v.number() },
  handler: async (ctx, args) => {
    assertRange(args.quantity, "quantity", 1, 99);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();

    const match = existing.find(
      (item) => item.productId === args.productId && (args.variantId ? item.variantId === args.variantId : !item.variantId)
    );

    if (match) {
      await ctx.db.patch(match._id, { quantity: match.quantity + args.quantity });
      return match._id;
    }

    return await ctx.db.insert("cartItems", {
      userId: identity.subject as Id<"users">,
      productId: args.productId,
      variantId: args.variantId,
      quantity: args.quantity,
    });
  },
});

export const updateCartItem = mutation({
  args: { id: v.id("cartItems"), quantity: v.number() },
  handler: async (ctx, args) => {
    if (args.quantity > 0) assertRange(args.quantity, "quantity", 1, 99);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Cart item not found");
    if (item.userId !== (identity.subject as Id<"users">)) throw new Error("Not your cart item");

    if (args.quantity <= 0) {
      await ctx.db.delete(args.id);
      return { message: "Item removed" };
    }
    await ctx.db.patch(args.id, { quantity: args.quantity });
    return { message: "Cart updated" };
  },
});

export const removeFromCart = mutation({
  args: { id: v.id("cartItems") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const item = await ctx.db.get(args.id);
    if (!item) throw new Error("Cart item not found");
    if (item.userId !== (identity.subject as Id<"users">)) throw new Error("Not your cart item");

    await ctx.db.delete(args.id);
    return { message: "Item removed" };
  },
});

export const clearCart = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const items = await ctx.db
      .query("cartItems")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();
    for (const item of items) await ctx.db.delete(item._id);
    return { message: "Cart cleared" };
  },
});

export const getWishlist = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("wishlistItems")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();
  },
});

export const addToWishlist = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("wishlistItems")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();
    if (existing.find((i) => i.productId === args.productId)) return { message: "Already in wishlist" };

    await ctx.db.insert("wishlistItems", {
      userId: identity.subject as Id<"users">,
      productId: args.productId,
    });
    return { message: "Added to wishlist" };
  },
});

export const removeFromWishlist = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const items = await ctx.db
      .query("wishlistItems")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();
    const match = items.find((i) => i.productId === args.productId);
    if (match) await ctx.db.delete(match._id);
    return { message: "Removed from wishlist" };
  },
});

export const getAddresses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("addresses")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .collect();
  },
});

export const addAddress = mutation({
  args: {
    label: v.optional(v.string()),
    fullName: v.string(),
    phone: v.string(),
    addressLine1: v.string(),
    addressLine2: v.optional(v.string()),
    city: v.string(),
    district: v.optional(v.string()),
    province: v.optional(v.string()),
    ward: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    country: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    assertString(args.fullName, "fullName", 1, 200);
    assertString(args.phone, "phone", 1, 30);
    assertString(args.addressLine1, "addressLine1", 1, 500);
    assertString(args.city, "city", 1, 100);
    if (args.label) assertString(args.label, "label", 1, 50);
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    if (args.isDefault) {
      const existing = await ctx.db
        .query("addresses")
        .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
        .collect();
      for (const addr of existing) {
        if (addr.isDefault) await ctx.db.patch(addr._id, { isDefault: false });
      }
    }

    return await ctx.db.insert("addresses", {
      userId: identity.subject as Id<"users">,
      label: args.label,
      fullName: args.fullName,
      phone: args.phone,
      addressLine1: args.addressLine1,
      addressLine2: args.addressLine2,
      city: args.city,
      district: args.district,
      province: args.province,
      ward: args.ward,
      postalCode: args.postalCode,
      country: args.country ?? "Nepal",
      isDefault: args.isDefault ?? false,
    });
  },
});

export const getInventoryReport = query({
  args: { page: v.optional(v.number()), limit: v.optional(v.number()), search: v.optional(v.string()), lowStockOnly: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();
    if (!profile || !["ADMIN", "SUPER_ADMIN"].includes(profile.role)) throw new Error("Insufficient permissions");

    let products = await ctx.db.query("products").collect();
    if (args.search) {
      const s = args.search.toLowerCase();
      products = products.filter((p) => p.name.toLowerCase().includes(s) || (p.sku && p.sku.toLowerCase().includes(s)));
    }
    if (args.lowStockOnly) products = products.filter((p) => p.stockQuantity <= p.lowStockThreshold);

    const limit = args.limit ?? 20;
    const page = args.page ?? 1;
    const total = products.length;

    return {
      products: products.slice((page - 1) * limit, page * limit).map((p) => ({
        id: p._id,
        name: p.name,
        sku: p.sku,
        stock_quantity: p.stockQuantity,
        low_stock_threshold: p.lowStockThreshold,
        is_active: p.isActive ? 1 : 0,
        category: null,
      })),
      total,
      page,
      limit,
    };
  },
});

export const getInventoryLogs = query({
  args: { page: v.optional(v.number()), limit: v.optional(v.number()), productId: v.optional(v.id("products")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    let logs = await ctx.db.query("inventoryLogs").collect();
    if (args.productId) logs = logs.filter((l) => l.productId === args.productId);

    logs.sort((a, b) => b._creationTime - a._creationTime);
    const limit = args.limit ?? 20;
    const page = args.page ?? 1;
    const total = logs.length;

    return {
      logs: logs.slice((page - 1) * limit, page * limit).map((l) => ({
        id: l._id,
        product_id: l.productId,
        variant_id: l.variantId,
        change_type: l.changeType,
        quantity: l.quantity,
        previous_stock: l.previousStock,
        new_stock: l.newStock,
        reason: l.reason,
        performed_by: l.performedBy,
        created_at: new Date(l._creationTime).toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
});

export const getLowStockAlerts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products
      .filter((p) => p.trackInventory && p.stockQuantity <= p.lowStockThreshold)
      .map((p) => ({
        id: p._id,
        name: p.name,
        sku: p.sku ?? "",
        stock_quantity: p.stockQuantity,
        low_stock_threshold: p.lowStockThreshold,
      }));
  },
});