"use client";

import { create } from "zustand";
import { firebaseSignOut } from "@/lib/firebase";
import { customerApi, type ProfileUpdatePayload } from "@/lib/api/customer";

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  email?: string;
  role: "customer" | "admin";
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  setUser: (user: AuthUser | null) => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  login: (user: AuthUser) => void;
  initialize: () => void;
  logout: () => Promise<void>;
  updateProfile: (profile: { name?: string; email?: string }) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: true,
  error: null,
  isConfigured: true,

  setUser: (user) => set({ user, isLoading: false }),
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),

  login: (user) => set({ user, isLoading: false, error: null }),
  initialize: () => {
    set({ isLoading: false });
  },

  logout: async () => {
    try {
      await firebaseSignOut();
    } catch {}
    try {
      const token = typeof document !== "undefined"
        ? document.cookie.split("; ").find((c) => c.startsWith("glamo-access-token="))?.split("=")[1]
        : undefined;
      if (token) {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ""}/api/v1/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }).catch(() => {});
      }
    } catch {}
    if (typeof document !== "undefined") {
      document.cookie = "glamo-access-token=; path=/; max-age=0; samesite=lax";
    }
    set({ user: null, error: null, isLoading: false });
  },

  updateProfile: async (profile) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      set({ error: "Please sign in before updating your profile." });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const nameParts = (profile.name || currentUser.name || "").trim().split(/\s+/);
      const payload: ProfileUpdatePayload = {};
      if (nameParts.length > 0) payload.firstName = nameParts[0];
      if (nameParts.length > 1) payload.lastName = nameParts.slice(1).join(" ");

      const response = await customerApi.updateProfile(payload);
      const updated = response.data;

      set({
        user: {
          ...currentUser,
          name: [updated.firstName, updated.lastName].filter(Boolean).join(" ") || currentUser.name,
          email: updated.email || currentUser.email,
          phone: updated.phone || currentUser.phone,
        },
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));