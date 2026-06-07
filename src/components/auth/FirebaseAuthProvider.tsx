"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  auth,
  onAuthStateChanged,
  isFirebaseConfigured,
  type User,
} from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

const AUTH_COOKIE_NAME = "glamo-access-token";

function setAuthCookie(token: string | null) {
  if (typeof document === "undefined") return;
  if (token) {
    const maxAge = 60 * 60 * 24 * 14;
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  } else {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  }
}

async function syncUserWithBackend(token: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
    const res = await fetch(`${apiUrl}/auth/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (error) {
    console.error("Failed to sync user with backend:", error);
  }
  return null;
}

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { login, logout } = useAuthStore();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, async (user) => {
      setFirebaseUser(user);
      setLoading(false);

      if (user) {
        const token = await user.getIdToken().catch(() => null);
        setAuthCookie(token);

        if (token) {
          const backendUser = await syncUserWithBackend(token);

          if (backendUser) {
            login({
              id: backendUser.id || user.uid,
              email: backendUser.email || user.email || undefined,
              name: backendUser.firstName
                ? `${backendUser.firstName}${backendUser.lastName ? " " + backendUser.lastName : ""}`
                : user.displayName || user.email?.split("@")[0] || "User",
              phone: backendUser.phone || "",
              role: backendUser.role || "customer",
            });
          } else {
            login({
              id: user.uid,
              email: user.email || undefined,
              name: user.displayName || user.email?.split("@")[0] || "User",
              phone: user.phoneNumber || "",
              role: "customer",
            });
          }
        } else {
          login({
            id: user.uid,
            email: user.email || undefined,
            name: user.displayName || user.email?.split("@")[0] || "User",
            phone: user.phoneNumber || "",
            role: "customer",
          });
        }

        useCartStore.getState().syncFromServer().catch(() => {});
        useWishlistStore.getState().syncFromServer().catch(() => {});
      } else {
        setAuthCookie(null);
        logout();
      }
    });

    return () => unsubscribe();
  }, [login, logout]);

  return (
    <AuthContext.Provider value={{ user: firebaseUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  return useContext(AuthContext);
}