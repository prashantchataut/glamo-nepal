import { mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const subscribe = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("newsletterSubscribers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) return { alreadySubscribed: true, id: existing._id };
    const id = await ctx.db.insert("newsletterSubscribers", {
      email: args.email,
      subscribedAt: Date.now(),
    });
    return { alreadySubscribed: false, id };
  },
});

export const getAllAdmin = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("newsletterSubscribers").order("desc").collect();
  },
});