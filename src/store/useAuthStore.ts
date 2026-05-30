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

  initialize: () => {
    // Convex Auth manages session state reactively via ConvexAuthProvider.
    // The useAuthSync hook synchronizes Convex Auth state into this store.
  },

  logout: async () => {
    // Actual sign-out is done via Convex Auth in the AuthForm component.
    // This just clears local state as a fallback.
    set({ user: null, error: null });
  },

  updateProfile: async (profile) => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      set({ error: "Please sign in before updating your profile." });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      set({
        user: {
          ...currentUser,
          name: profile.name || currentUser.name,
          email: profile.email || currentUser.email,
        },
        isLoading: false,
        error: null,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Profile update failed.", isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));