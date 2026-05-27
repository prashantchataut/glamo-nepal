import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("brands").order("desc").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const brands = await ctx.db
      .query("brands")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    return brands[0] ?? null;
  },
});

export const getFeatured = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("brands")
      .withIndex("by_featured", (q) => q.eq("featured", true))
      .collect();
  },
});

export const create = internalMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    logo: v.string(),
    coverImage: v.optional(v.string()),
    origin: v.string(),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("brands", args);
  },
});

export const update = internalMutation({
  args: {
    id: v.id("brands"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    origin: v.optional(v.string()),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const brand = await ctx.db.get(id);
    if (!brand) throw new Error("Brand not found");
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleanedUpdates);
    return await ctx.db.get(id);
  },
});

export const remove = internalMutation({
  args: { id: v.id("brands") },
  handler: async (ctx, args) => {
    const brand = await ctx.db.get(args.id);
    if (!brand) throw new Error("Brand not found");
    await ctx.db.delete(args.id);
    return args.id;
  },
});