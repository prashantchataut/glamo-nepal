import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

function requireAdmin(ctx: any) {
  const identity = ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity;
}

function requireRole(profile: any, roles: string[]) {
  if (!profile || !roles.includes(profile.role)) {
    throw new Error("Insufficient permissions");
  }
  return profile;
}

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();
    requireRole(profile, ["ADMIN", "SUPER_ADMIN"]);

    const now = Date.now();
    const oneDayMs = 86400000;
    const thirtyDaysMs = 30 * oneDayMs;
    const thirtyDaysAgo = now - thirtyDaysMs;

    const [allOrders, allUsers, allProducts] = await Promise.all([
      ctx.db.query("orders").collect(),
      ctx.db.query("userProfiles").collect(),
      ctx.db.query("products").collect(),
    ]);

    const todayStart = new Date(now).setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(now).setDate(1);
    const monthStart = new Date(thisMonthStart).setHours(0, 0, 0, 0);

    const todayOrders = allOrders.filter((o) => o._creationTime >= todayStart);
    const monthOrders = allOrders.filter((o) => o._creationTime >= monthStart);

    const activeProducts = allProducts.filter((p) => p.isActive);
    const lowStockProducts = allProducts.filter(
      (p) => p.trackInventory && p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold
    );
    const outOfStockProducts = allProducts.filter(
      (p) => p.trackInventory && p.stockQuantity <= 0
    );

    const orderStatusBreakdown: Record<string, number> = {};
    for (const o of allOrders) {
      orderStatusBreakdown[o.status] = (orderStatusBreakdown[o.status] || 0) + 1;
    }

    const revenueLast30Days: Record<string, { revenue: number; orders: number }> = {};
    for (const o of allOrders) {
      if (o._creationTime >= thirtyDaysAgo && o.status !== "CANCELLED") {
        const dayKey = new Date(o._creationTime).toISOString().split("T")[0];
        if (!revenueLast30Days[dayKey]) revenueLast30Days[dayKey] = { revenue: 0, orders: 0 };
        revenueLast30Days[dayKey].revenue += o.totalAmount;
        revenueLast30Days[dayKey].orders += 1;
      }
    }

    const recentOrders = allOrders
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 10);

    const recentUsers = allUsers
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 5);

    const categoryBreakdown: Record<string, number> = {};
    for (const o of allOrders.filter((o) => o.status !== "CANCELLED")) {
      categoryBreakdown["All"] = (categoryBreakdown["All"] || 0) + o.totalAmount;
    }

    return {
      today: {
        orders: todayOrders.length,
        revenue: todayOrders.reduce((s, o) => s + (o.status !== "CANCELLED" ? o.totalAmount : 0), 0),
        newUsers: allUsers.filter((u) => u._creationTime >= todayStart).length,
      },
      thisMonth: {
        orders: monthOrders.length,
        revenue: monthOrders.reduce((s, o) => s + (o.status !== "CANCELLED" ? o.totalAmount : 0), 0),
      },
      allTime: {
        orders: allOrders.length,
        revenue: allOrders.reduce((s, o) => s + (o.status !== "CANCELLED" ? o.totalAmount : 0), 0),
        customers: allUsers.length,
        activeProducts: activeProducts.length,
      },
      orderStatusBreakdown,
      revenueLast30Days,
      inventoryAlerts: {
        lowStock: lowStockProducts.length,
        outOfStock: outOfStockProducts.length,
        lowStockProducts: lowStockProducts.slice(0, 5).map((p) => ({
          id: p._id,
          name: p.name,
          sku: p.sku ?? "",
          stock_quantity: p.stockQuantity,
          low_stock_threshold: p.lowStockThreshold,
        })),
        outOfStockProducts: outOfStockProducts.slice(0, 5).map((p) => ({
          id: p._id,
          name: p.name,
          sku: p.sku ?? "",
          stock_quantity: p.stockQuantity,
        })),
      },
      recentActivity: {
        orders: recentOrders.map((o) => ({
          id: o._id,
          order_number: o.orderNumber,
          total_amount: o.totalAmount,
          status: o.status,
          payment_method: o.paymentMethod,
          payment_status: o.paymentStatus,
          created_at: new Date(o._creationTime).toISOString(),
          user_id: o.userId,
          customerName: "",
        })),
        users: recentUsers.map((u) => ({
          id: u._id,
          first_name: u.name,
          last_name: "",
          email: "",
          role: u.role,
          created_at: new Date(u._creationTime).toISOString(),
        })),
      },
      topPerformers: {
        products: [],
        categories: categoryBreakdown,
      },
    };
  },
});

export const listUsers = query({
  args: {
    search: v.optional(v.string()),
    role: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();
    requireRole(profile, ["ADMIN", "SUPER_ADMIN"]);

    const limit = args.limit ?? 20;
    const page = args.page ?? 1;

    let profiles = await ctx.db.query("userProfiles").collect();

    if (args.search) {
      const s = args.search.toLowerCase();
      profiles = profiles.filter((p) => p.name.toLowerCase().includes(s));
    }
    if (args.role) {
      profiles = profiles.filter((p) => p.role === args.role);
    }

    const total = profiles.length;
    const users = profiles.slice((page - 1) * limit, page * limit);

    return {
      users: users.map((u) => ({
        id: u._id,
        first_name: u.name,
        last_name: "",
        email: "",
        phone: u.phone,
        role: u.role,
        is_active: u.isActive ? 1 : 0,
        created_at: new Date(u._creationTime).toISOString(),
        updated_at: new Date(u._creationTime).toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
});

export const updateUserRole = mutation({
  args: { userId: v.id("userProfiles"), role: v.union(v.literal("CUSTOMER"), v.literal("STAFF"), v.literal("ADMIN"), v.literal("SUPER_ADMIN")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();
    await ctx.db.patch(args.userId, { role: args.role });
    return { message: "Role updated" };
  },
});

export const updateUserStatus = mutation({
  args: { userId: v.id("userProfiles"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();
    requireRole(profile, ["ADMIN", "SUPER_ADMIN"]);
    await ctx.db.patch(args.userId, { isActive: args.isActive });
    return { message: "Status updated" };
  },
});

export const getAuditLogs = query({
  args: {
    entity: v.optional(v.string()),
    entityId: v.optional(v.string()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();
    requireRole(profile, ["SUPER_ADMIN"]);

    const limit = args.limit ?? 20;
    const page = args.page ?? 1;
    let logs = await ctx.db.query("auditLogs").collect();

    if (args.entity) logs = logs.filter((l) => l.entity === args.entity);
    if (args.entityId) logs = logs.filter((l) => l.entityId === args.entityId);

    logs.sort((a, b) => b._creationTime - a._creationTime);
    const total = logs.length;

    return {
      logs: logs.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
});

export const createAuditLog = mutation({
  args: {
    action: v.string(),
    entity: v.string(),
    entityId: v.optional(v.string()),
    changes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();
    requireRole(profile, ["ADMIN", "SUPER_ADMIN", "STAFF"]);

    await ctx.db.insert("auditLogs", {
      userId: identity.subject as Id<"users">,
      action: args.action,
      entity: args.entity,
      entityId: args.entityId,
      changes: args.changes,
    });
  },
});

export const getNotifications = query({
  args: {
    isRead: v.optional(v.boolean()),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const limit = args.limit ?? 20;
    const page = args.page ?? 1;
    let notifications = await ctx.db.query("notifications").collect();

    notifications = notifications.filter((n) => n.userId === identity.subject || !n.userId);
    if (args.isRead !== undefined) notifications = notifications.filter((n) => n.isRead === args.isRead);

    notifications.sort((a, b) => b._creationTime - a._creationTime);
    const total = notifications.length;
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return {
      notifications: notifications.slice((page - 1) * limit, page * limit),
      unreadCount,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
});

export const markNotificationRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { isRead: true });
    return { message: "Notification marked as read" };
  },
});

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const notifications = await ctx.db.query("notifications").collect();
    const unread = notifications.filter((n) => !n.isRead && (n.userId === identity.subject || !n.userId));
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
    return { message: "All notifications marked as read" };
  },
});

export const getSalesReport = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    groupBy: v.optional(v.union(v.literal("day"), v.literal("week"), v.literal("month"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();
    requireRole(profile, ["ADMIN", "SUPER_ADMIN"]);

    const startMs = new Date(args.startDate).getTime();
    const endMs = new Date(args.endDate).getTime();
    const orders = await ctx.db.query("orders").collect();
    const filtered = orders.filter(
      (o) => o._creationTime >= startMs && o._creationTime <= endMs && o.status !== "CANCELLED"
    );

    const totalRevenue = filtered.reduce((s, o) => s + o.totalAmount, 0);
    const groupBy = args.groupBy ?? "day";

    const revenueByPeriod: Record<string, { revenue: number; orders: number }> = {};
    for (const o of filtered) {
      const key = new Date(o._creationTime).toISOString().split("T")[0];
      if (!revenueByPeriod[key]) revenueByPeriod[key] = { revenue: 0, orders: 0 };
      revenueByPeriod[key].revenue += o.totalAmount;
      revenueByPeriod[key].orders += 1;
    }

    const paymentMethodBreakdown: Record<string, { revenue: number; orders: number }> = {};
    for (const o of filtered) {
      if (!paymentMethodBreakdown[o.paymentMethod]) paymentMethodBreakdown[o.paymentMethod] = { revenue: 0, orders: 0 };
      paymentMethodBreakdown[o.paymentMethod].revenue += o.totalAmount;
      paymentMethodBreakdown[o.paymentMethod].orders += 1;
    }

    return {
      startDate: args.startDate,
      endDate: args.endDate,
      groupBy,
      totalRevenue,
      totalOrders: filtered.length,
      revenueByPeriod,
      paymentMethodBreakdown,
      categoryBreakdown: {},
    };
  },
});