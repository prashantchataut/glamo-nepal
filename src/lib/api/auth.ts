import { apiRequest } from "./client";
import type { Customer } from "./contracts";

export interface ForgotPasswordResponse {
  accountExists?: boolean;
}

export const authApi = {
  sync: (idToken: string) =>
    apiRequest<Customer>("/auth/sync", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    }),
  logout: () => apiRequest<{ ok: true }>("/auth/logout", { method: "POST" }),
  me: () => apiRequest<Customer>("/auth/me"),
  forgotPassword: (email: string) =>
    apiRequest<ForgotPasswordResponse>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, password: string) =>
    apiRequest<null>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    }),
  sendVerificationEmail: (email: string) =>
    apiRequest<null>("/auth/send-verification", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verifyEmail: (token: string) =>
    apiRequest<null>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
};
