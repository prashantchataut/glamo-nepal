import type { Id } from "./_generated/dataModel";

export function getUserId(identity: { subject: string }): Id<"users"> {
  return identity.subject as Id<"users">;
}