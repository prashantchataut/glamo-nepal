import type { Customer } from "@/lib/api/contracts";
import { apiRequest } from "@/lib/api/client";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
  phone: string;
}

export interface AuthSession {
  customer: Customer;
  role: "customer" | "admin";
  expiresAt: string;
}

export const authApi = {
  login: (payload: LoginPayload) => apiRequest<AuthSession>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  register: (payload: RegisterPayload) => apiRequest<AuthSession>("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  forgotPassword: (email: string) => apiRequest<{ queued: boolean }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => apiRequest<{ updated: boolean }>("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) }),
  logout: () => apiRequest<{ ok: true }>("/auth/logout", { method: "POST" }),
  me: () => apiRequest<Customer>("/auth/me"),
};
