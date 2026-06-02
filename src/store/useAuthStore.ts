"use client";

import { create } from "zustand";

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
    set({ user: null, error: null });
  },

  updateProfile: async (profile) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      set({ error: "Please sign in before updating your profile." });
      return;
    }
    set({
      user: {
        ...currentUser,
        name: profile.name || currentUser.name,
        email: profile.email || currentUser.email,
      },
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));