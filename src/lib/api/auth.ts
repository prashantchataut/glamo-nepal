import { apiRequest } from "./client";
import type { Customer } from "./contracts";

export const authApi = {
  sync: (idToken: string) =>
    apiRequest<Customer>("/auth/sync", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    }),
  logout: () => apiRequest<{ ok: true }>("/auth/logout", { method: "POST" }),
  me: () => apiRequest<Customer>("/auth/me"),
};
