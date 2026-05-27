import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("collections").order("desc").collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const collections = await ctx.db
      .query("collections")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .collect();
    return collections[0] ?? null;
  },
});

export const create = internalMutation({
  args: {
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    image: v.string(),
    type: v.union(v.literal("curated"), v.literal("category")),
    featured: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("collections", args);
  },
});

export const update = internalMutation({
  args: {
    id: v.id("collections"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    type: v.optional(v.union(v.literal("curated"), v.literal("category"))),
    featured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const collection = await ctx.db.get(id);
    if (!collection) throw new Error("Collection not found");
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    );
    await ctx.db.patch(id, cleanedUpdates);
    return await ctx.db.get(id);
  },
});

export const remove = internalMutation({
  args: { id: v.id("collections") },
  handler: async (ctx, args) => {
    const collection = await ctx.db.get(args.id);
    if (!collection) throw new Error("Collection not found");
    await ctx.db.delete(args.id);
    return args.id;
  },
});