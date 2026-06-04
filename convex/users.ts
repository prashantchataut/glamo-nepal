import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const getProfile = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const userId = args.userId ?? (await ctx.auth.getUserIdentity())?.subject;
    if (!userId) return null;
    return await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", userId as Id<"users">))
      .first();
  },
});

export const createProfile = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    phone: v.optional(v.string()),
    role: v.union(v.literal("CUSTOMER"), v.literal("STAFF"), v.literal("ADMIN"), v.literal("SUPER_ADMIN")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) return existing._id;
    return await ctx.db.insert("userProfiles", {
      userId: args.userId,
      name: args.name,
      phone: args.phone,
      role: args.role,
      isActive: true,
    });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();
    if (!profile) throw new Error("Profile not found");
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.phone !== undefined) updates.phone = args.phone;
    await ctx.db.patch(profile._id, updates);
    return profile._id;
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();
    if (!profile) return null;
    return {
      id: identity.subject,
      email: identity.email,
      name: profile.name,
      phone: profile.phone,
      role: profile.role,
      isActive: profile.isActive,
    };
  },
});

export const getUserRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("userId", (q) => q.eq("userId", identity.subject as Id<"users">))
      .first();
    return profile?.role ?? null;
  },
});

export const requestPasswordReset = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    throw new Error("Password reset is handled by Convex Auth. Use the built-in forgot password flow.");
  },
});