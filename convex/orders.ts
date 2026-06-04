import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

function assertString(value: unknown, field: string, min = 1, max = 500) {
  if (typeof value !== "string" || value.length < min || value.length > max) {
    throw new Error(`${field} must be ${min}-${max} characters`);
  }
}

function assertNonNegative(value: number, field: string) {
  if (value < 0) throw new Error(`${field} must be non-negative`);
}

function assertRange(value: number, field: string, min: number, max: number) {
  if (value < min || value > max) throw new Error(`${field} must be ${min}-${max}`);
}

function assertMinLength(value: string, field: string, min: number, max: number) {
  if (value.length < min || value.length > max) {
    throw new Error(`${field} must be ${min}-${max} characters`);
  }
}

function requireAuth(ctx: any) {
  const identity = ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity;
}

export const listOrders = query({
  args: {
    status: v.optional(v.string()),
    paymentStatus: v.optional(v.string()),
    search: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    requireAuth(ctx);
    const limit = args.limit ?? 20;
    const page = args.page ?? 1;

    let orders = await ctx.db.query("orders").collect();

    if (args.status) orders = orders.filter((o) => o.status === args.status);
    if (args.paymentStatus) orders = orders.filter((o) => o.paymentStatus === args.paymentStatus);
    if (args.search) {
      const s = args.search.toLowerCase();
      orders = orders.filter((o) => o.orderNumber.toLowerCase().includes(s));
    }

    orders.sort((a, b) => b._creationTime - a._creationTime);
    const total = orders.length;
    const paged = orders.slice((page - 1) * limit, page * limit);

    const enriched = await Promise.all(
      paged.map(async (o) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("orderId", (q) => q.eq("orderId", o._id))
          .collect();
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("userId", (q) => q.eq("userId", o.userId))
          .first();
        return {
          id: o._id,
          order_number: o.orderNumber,
          user_id: o.userId,
          status: o.status,
          payment_status: o.paymentStatus,
          payment_method: o.paymentMethod,
          payment_id: o.paymentId,
          subtotal: o.subtotal,
          shipping_charge: o.shippingCharge,
          discount_amount: o.discountAmount,
          total_amount: o.totalAmount,
          shipping_address: o.shippingAddress,
          billing_address: o.billingAddress,
          notes: o.notes,
          cancelled_at: o.cancelledAt ? new Date(o.cancelledAt).toISOString() : undefined,
          cancel_reason: o.cancelReason,
          created_at: new Date(o._creationTime).toISOString(),
          updated_at: new Date(o._creationTime).toISOString(),
          items: items.map((i) => ({
            id: i._id,
            product_id: i.productId,
            variant_id: i.variantId,
            product_name: i.productName,
            variant_name: i.variantName,
            sku: i.sku,
            quantity: i.quantity,
            unit_price: i.unitPrice,
            total_price: i.totalPrice,
            image_url: i.imageUrl,
          })),
          customer: profile
            ? { id: profile._id, first_name: profile.name, last_name: "", email: "", phone: profile.phone }
            : null,
        };
      })
    );

    return { orders: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  },
});

export const getOrder = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    requireAuth(ctx);
    const o = await ctx.db.get(args.id);
    if (!o) throw new Error("Order not found");

    const items = await ctx.db
      .query("orderItems")
      .withIndex("orderId", (q) => q.eq("orderId", o._id))
      .collect();
    const statusHistory = await ctx.db
      .query("orderStatusHistories")
      .withIndex("orderId", (q) => q.eq("orderId", o._id))
      .collect();
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", o.userId))
      .first();

    return {
      id: o._id,
      order_number: o.orderNumber,
      user_id: o.userId,
      status: o.status,
      payment_status: o.paymentStatus,
      payment_method: o.paymentMethod,
      payment_id: o.paymentId,
      subtotal: o.subtotal,
      shipping_charge: o.shippingCharge,
      discount_amount: o.discountAmount,
      total_amount: o.totalAmount,
      shipping_address: o.shippingAddress,
      billing_address: o.billingAddress,
      notes: o.notes,
      cancelled_at: o.cancelledAt ? new Date(o.cancelledAt).toISOString() : undefined,
      cancel_reason: o.cancelReason,
      created_at: new Date(o._creationTime).toISOString(),
      updated_at: new Date(o._creationTime).toISOString(),
      items: items.map((i) => ({
        id: i._id,
        product_id: i.productId,
        variant_id: i.variantId,
        product_name: i.productName,
        variant_name: i.variantName,
        sku: i.sku,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        total_price: i.totalPrice,
        image_url: i.imageUrl,
      })),
      status_history: statusHistory.map((s) => ({
        id: s._id,
        status: s.status,
        comment: s.comment,
        changed_by: s.changedBy,
        created_at: new Date(s._creationTime).toISOString(),
      })),
      customer: profile
        ? { id: profile._id, first_name: profile.name, last_name: "", email: "", phone: profile.phone }
        : null,
    };
  },
});

export const updateOrderStatus = mutation({
  args: { id: v.id("orders"), status: v.union(v.literal("PENDING"), v.literal("CONFIRMED"), v.literal("PROCESSING"), v.literal("SHIPPED"), v.literal("DELIVERED"), v.literal("CANCELLED"), v.literal("REFUNDED")) },
  handler: async (ctx, args) => {
    const identity = requireAuth(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();
    if (!profile || !["ADMIN", "SUPER_ADMIN", "STAFF"].includes(profile.role)) {
      throw new Error("Insufficient permissions");
    }

    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");

    const validStatuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
    if (!validStatuses.includes(args.status)) throw new Error("Invalid status");

    await ctx.db.patch(args.id, { status: args.status });
    await ctx.db.insert("orderStatusHistories", {
      orderId: args.id,
      status: args.status,
      changedBy: identity.subject as Id<"users">,
    });

    await ctx.db.insert("auditLogs", {
      userId: identity.subject as Id<"users">,
      action: "UPDATE_STATUS",
      entity: "orders",
      entityId: args.id,
      changes: JSON.stringify([{ field: "status", newValue: String(args.status) }]),
    });

    return { message: "Order status updated" };
  },
});

export const cancelOrder = mutation({
  args: { id: v.id("orders"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = requireAuth(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();

    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");

    if (order.status === "CANCELLED") throw new Error("Order already cancelled");
    if (order.status === "DELIVERED") throw new Error("Cannot cancel a delivered order");

    await ctx.db.patch(args.id, {
      status: "CANCELLED",
      cancelledAt: Date.now(),
      cancelReason: args.reason,
    });

    await ctx.db.insert("orderStatusHistories", {
      orderId: args.id,
      status: "CANCELLED",
      comment: args.reason,
      changedBy: identity.subject as Id<"users">,
    });

    await ctx.db.insert("auditLogs", {
      userId: identity.subject as Id<"users">,
      action: "CANCEL",
      entity: "orders",
      entityId: args.id,
      changes: JSON.stringify([{ field: "status", newValue: "CANCELLED" }, ...(args.reason ? [{ field: "cancelReason", newValue: args.reason }] : [])]),
    });

    return { message: "Order cancelled" };
  },
});

export const createOrder = mutation({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        variantId: v.optional(v.id("productVariants")),
        name: v.string(),
        quantity: v.number(),
        unitPrice: v.number(),
        totalPrice: v.number(),
        imageUrl: v.optional(v.string()),
      })
    ),
    shippingAddress: v.object({
      fullName: v.string(),
      phone: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      district: v.optional(v.string()),
      province: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      country: v.optional(v.string()),
      label: v.optional(v.string()),
      isDefault: v.optional(v.boolean()),
    }),
    billingAddress: v.optional(v.object({
      fullName: v.string(),
      phone: v.string(),
      addressLine1: v.string(),
      addressLine2: v.optional(v.string()),
      city: v.string(),
      district: v.optional(v.string()),
      province: v.optional(v.string()),
      postalCode: v.optional(v.string()),
      country: v.optional(v.string()),
      label: v.optional(v.string()),
      isDefault: v.optional(v.boolean()),
    })),
    paymentMethod: v.union(
      v.literal("CASH_ON_DELIVERY"),
      v.literal("KHALTI"),
      v.literal("ESEWA"),
      v.literal("BANK_TRANSFER")
    ),
    subtotal: v.number(),
    shippingCharge: v.number(),
    discountAmount: v.optional(v.number()),
    totalAmount: v.number(),
    notes: v.optional(v.string()),
    couponId: v.optional(v.id("coupons")),
  },
  handler: async (ctx, args) => {
    for (const item of args.items) {
      assertMinLength(item.name, "item name", 1, 500);
      assertRange(item.quantity, "quantity", 1, 99);
      assertNonNegative(item.unitPrice, "unitPrice");
      assertNonNegative(item.totalPrice, "totalPrice");
    }
    assertMinLength(args.shippingAddress.fullName, "fullName", 1, 200);
    assertMinLength(args.shippingAddress.phone, "phone", 1, 30);
    assertMinLength(args.shippingAddress.addressLine1, "addressLine1", 1, 500);
    assertMinLength(args.shippingAddress.city, "city", 1, 100);
    if (args.billingAddress) {
      assertMinLength(args.billingAddress.fullName, "fullName", 1, 200);
      assertMinLength(args.billingAddress.phone, "phone", 1, 30);
      assertMinLength(args.billingAddress.addressLine1, "addressLine1", 1, 500);
      assertMinLength(args.billingAddress.city, "city", 1, 100);
    }
    assertNonNegative(args.subtotal, "subtotal");
    assertNonNegative(args.shippingCharge, "shippingCharge");
    assertNonNegative(args.totalAmount, "totalAmount");
    if (args.discountAmount) assertNonNegative(args.discountAmount, "discountAmount");
    if (args.notes) assertString(args.notes, "notes", 1, 2000);

    const identity = requireAuth(ctx);

    const orderCount = (await ctx.db.query("orders").collect()).length;
    const orderNumber = `GLM-${String(orderCount + 1).padStart(6, "0")}`;

    const orderId = await ctx.db.insert("orders", {
      orderNumber: orderNumber,
      userId: identity.subject as Id<"users">,
      status: "PENDING",
      paymentStatus: args.paymentMethod === "CASH_ON_DELIVERY" ? "PENDING" : "PENDING",
      paymentMethod: args.paymentMethod,
      subtotal: args.subtotal,
      shippingCharge: args.shippingCharge,
      discountAmount: args.discountAmount ?? 0,
      totalAmount: args.totalAmount,
      shippingAddress: {
        fullName: args.shippingAddress.fullName,
        phone: args.shippingAddress.phone,
        addressLine1: args.shippingAddress.addressLine1,
        addressLine2: args.shippingAddress.addressLine2,
        city: args.shippingAddress.city,
        district: args.shippingAddress.district,
        province: args.shippingAddress.province,
        postalCode: args.shippingAddress.postalCode,
        country: args.shippingAddress.country ?? "Nepal",
      },
      billingAddress: args.billingAddress
        ? {
            fullName: args.billingAddress.fullName,
            phone: args.billingAddress.phone,
            addressLine1: args.billingAddress.addressLine1,
            addressLine2: args.billingAddress.addressLine2,
            city: args.billingAddress.city,
            district: args.billingAddress.district,
            province: args.billingAddress.province,
            postalCode: args.billingAddress.postalCode,
            country: args.billingAddress.country ?? "Nepal",
          }
        : undefined,
      notes: args.notes,
      couponId: args.couponId,
    });

    for (const item of args.items) {
      await ctx.db.insert("orderItems", {
        orderId,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        imageUrl: item.imageUrl,
      });
    }

    await ctx.db.insert("orderStatusHistories", {
      orderId,
      status: "PENDING",
      changedBy: identity.subject as Id<"users">,
    });

    return { orderId, orderNumber };
  },
});

export const getMyOrders = query({
  args: {},
  handler: async (ctx) => {
    const identity = requireAuth(ctx);
    const orders = await ctx.db.query("orders").collect();
    const myOrders = orders.filter((o) => o.userId === (identity.subject as Id<"users">));

    const enriched = await Promise.all(
      myOrders.map(async (o) => {
        const items = await ctx.db
          .query("orderItems")
          .withIndex("orderId", (q) => q.eq("orderId", o._id))
          .collect();
        return {
          id: o._id,
          orderNumber: o.orderNumber,
          status: o.status,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          totalAmount: o.totalAmount,
          subtotal: o.subtotal,
          shippingCharge: o.shippingCharge,
          createdAt: new Date(o._creationTime).toISOString(),
          items: items.map((i) => ({
            productId: i.productId,
            name: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
            imageUrl: i.imageUrl,
          })),
        };
      })
    );

    return enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
});

export const cancelMyOrder = mutation({
  args: { id: v.id("orders"), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = requireAuth(ctx);
    const order = await ctx.db.get(args.id);
    if (!order) throw new Error("Order not found");
    if (order.userId !== (identity.subject as Id<"users">)) throw new Error("Not your order");
    if (order.status === "CANCELLED") throw new Error("Order already cancelled");
    if (order.status === "DELIVERED" || order.status === "SHIPPED") {
      throw new Error("Cannot cancel a shipped or delivered order");
    }

    await ctx.db.patch(args.id, {
      status: "CANCELLED",
      cancelledAt: Date.now(),
      cancelReason: args.reason ?? "Cancelled by customer",
    });

    await ctx.db.insert("orderStatusHistories", {
      orderId: args.id,
      status: "CANCELLED",
      comment: args.reason ?? "Cancelled by customer",
      changedBy: identity.subject as Id<"users">,
    });

    return { message: "Order cancelled" };
  },
});