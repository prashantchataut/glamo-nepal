import { create } from "zustand";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let supabase: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      detectSessionInUrl: true,
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "customer" | "admin";
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  hydrateSession: () => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<void>;
  updateProfile: (profile: { name?: string; phone?: string; birthday?: string; skinType?: string }) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isLoading: false,
  error: null,
  isConfigured: isSupabaseConfigured,

  login: async (email, password) => {
    if (!supabase) {
      set({ error: "Authentication is not available yet. Please try again later or contact us on WhatsApp." });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || email,
            name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "",
            phone: data.user.user_metadata?.phone || "",
            role: "customer" as const,
          },
          isLoading: false,
          error: null,
        });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Login failed. Please try again.",
        isLoading: false,
      });
    }
  },

  loginWithGoogle: async () => {
    if (!supabase) {
      set({ error: "Google sign-in requires Supabase configuration." });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const origin = window.location.origin;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${origin}/account` },
      });
      if (authError) throw authError;
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Google sign-in failed.",
        isLoading: false,
      });
    }
  },

  hydrateSession: async () => {
    if (!supabase) return;
    set({ isLoading: true, error: null });
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const sessionUser = data.session?.user;
      if (!sessionUser) {
        set({ user: null, isLoading: false });
        return;
      }
      set({
        user: {
          id: sessionUser.id,
          email: sessionUser.email || "",
          name: String(sessionUser.user_metadata?.name || sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || ""),
          phone: String(sessionUser.user_metadata?.phone || ""),
          role: "customer",
        },
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Session refresh failed.", isLoading: false });
    }
  },

  register: async (name, email, phone, password) => {
    if (!supabase) {
      set({ error: "Authentication is not available yet. Please try again later." });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone },
        },
      });
      if (authError) throw authError;
      if (data.user) {
        set({
          user: {
            id: data.user.id,
            email: data.user.email || email,
            name,
            phone,
            role: "customer" as const,
          },
          isLoading: false,
          error: null,
        });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Registration failed. Please try again.",
        isLoading: false,
      });
    }
  },

  logout: async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    set({ user: null, error: null });
  },

  forgotPassword: async (email) => {
    if (!supabase) {
      set({ error: "Authentication is not available yet." });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (authError) throw authError;
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Password reset failed.",
        isLoading: false,
      });
    }
  },

  resetPassword: async (password) => {
    if (!supabase) {
      set({ error: "Authentication is not available yet." });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      set({ isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Password update failed.",
        isLoading: false,
      });
    }
  },

  updateProfile: async (profile) => {
    if (!supabase) {
      set({ error: "Profile updates require Supabase configuration." });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const currentUser = sessionData.session?.user;
      if (!currentUser) throw new Error("Please sign in before updating your profile.");
      const { data, error: updateError } = await supabase.auth.updateUser({
        data: {
          name: profile.name || "",
          phone: profile.phone || "",
          birthday: profile.birthday || "",
          skinType: profile.skinType || "",
        },
      });
      if (updateError) throw updateError;
      const updatedUser = data.user || currentUser;
      set({
        user: {
          id: updatedUser.id,
          email: updatedUser.email || "",
          name: String(updatedUser.user_metadata?.name || ""),
          phone: String(updatedUser.user_metadata?.phone || ""),
          role: "customer",
        },
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Profile update failed.", isLoading: false });
    }
  },

  updatePassword: async (_currentPassword, newPassword) => {
    if (!supabase) {
      set({ error: "Password updates require Supabase configuration." });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session?.user) throw new Error("Please sign in before updating your password.");
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      set({ isLoading: false, error: null });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Password update failed.", isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));