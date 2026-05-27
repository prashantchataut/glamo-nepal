import { QueryCtx, MutationCtx } from "./_generated/server";

export async function requireAdminIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Authentication required. Please sign in.");
  }
  return identity;
}

export async function getOptionalIdentity(ctx: QueryCtx | MutationCtx) {
  return await ctx.auth.getUserIdentity();
}