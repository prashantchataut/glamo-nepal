import { mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    subject: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("contactMessages", {
      ...args,
      read: false,
    });
  },
});

export const getAllAdmin = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("contactMessages").order("desc").collect();
  },
});

export const markRead = internalMutation({
  args: { id: v.id("contactMessages") },
  handler: async (ctx, args) => {
    const msg = await ctx.db.get(args.id);
    if (!msg) throw new Error("Message not found");
    await ctx.db.patch(args.id, { read: true });
    return args.id;
  },
});