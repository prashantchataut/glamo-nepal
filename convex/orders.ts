import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    orderNumber: v.string(),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.string(),
    items: v.array(
      v.object({
        productId: v.string(),
        name: v.string(),
        brand: v.string(),
        image: v.string(),
        price: v.number(),
        quantity: v.number(),
        selectedShade: v.optional(v.string()),
      })
    ),
    subtotal: v.number(),
    deliveryFee: v.number(),
    giftWrap: v.boolean(),
    giftWrapFee: v.number(),
    grandTotal: v.number(),
    currency: v.literal("NPR"),
    paymentMethod: v.string(),
    shippingAddress: v.object({
      fullName: v.string(),
      phone: v.string(),
      province: v.string(),
      district: v.string(),
      city: v.string(),
      ward: v.string(),
      addressLine1: v.string(),
    }),
    orderNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const orderId = await ctx.db.insert("orders", {
      ...args,
      status: "Pending",
    });

    for (const item of args.items) {
      const product = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", item.productId))
        .first();
      if (product) {
        const newStock = Math.max(0, product.stockCount - item.quantity);
        const shadeOptions = product.shadeOptions?.map((s) => {
          if (s.name === item.selectedShade && s.stockCount !== undefined) {
            return { ...s, stockCount: Math.max(0, s.stockCount - item.quantity) };
          }
          return s;
        });
        await ctx.db.patch(product._id, {
          stockCount: newStock,
          inStock: newStock > 0,
          ...(shadeOptions ? { shadeOptions } : {}),
        });
      }
    }

    return orderId;
  },
});

export const getByOrderNumber = query({
  args: { orderNumber: v.string() },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_order_number", (q) => q.eq("orderNumber", args.orderNumber))
      .collect();
    return orders[0] ?? null;
  },
});

export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_phone", (q) => q.eq("customerPhone", args.phone))
      .order("desc")
      .collect();
  },
});

export const getByStatusAdmin = internalQuery({
  args: { status: v.union(v.literal("Pending"), v.literal("Confirmed"), v.literal("Processing"), v.literal("Shipped"), v.literal("Delivered"), v.literal("Cancelled")) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orders")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
  },
});

export const getAllAdmin = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("orders").order("desc").collect();
  },
});

export const getByStatusAdmin = internalQuery({

export const updateStatus = internalMutation({
  args: {
    id: v.id("orders"),
    status: v.union(v.literal("Pending"), v.literal("Confirmed"), v.literal("Processing"), v.literal("Shipped"), v.literal("Delivered"), v.literal("Cancelled")),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");
    await ctx.db.patch(args.id, { status: args.status });
    return await ctx.db.get(args.id);
  },
});