import { create } from "zustand";
import { persist } from "zustand/middleware";

export type MockUserRole = "customer" | "admin";

interface MockUser {
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  role: MockUserRole;
}

interface AuthState {
  user: MockUser | null;
  login: (email: string, role?: MockUserRole) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (email, role = "customer") => set({
        user: {
          name: role === "admin" ? "GLAMO Admin" : "GLAMO Member",
          email,
          phone: "+977 9818212188",
          loyaltyPoints: role === "admin" ? 0 : 1280,
          role,
        },
      }),
      logout: () => set({ user: null }),
    }),
    { name: "glamo-auth-session" },
  ),
);
