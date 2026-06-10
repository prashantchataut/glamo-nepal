"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import {
  auth,
  onAuthStateChanged,
  isFirebaseConfigured,
  type User,
} from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { csrfHeaders } from "@/lib/csrf";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  syncComplete: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, syncComplete: false });

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

async function syncUserWithBackend(token: string, displayName?: string | null) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";
    const body: Record<string, string> = {};
    if (displayName) {
      const parts = displayName.split(" ");
      body.firstName = parts[0] || "";
      body.lastName = parts.slice(1).join(" ") || "";
    }
    const res = await fetch(`${apiUrl}/auth/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...csrfHeaders(),
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    } else {
      console.error("[Auth] Account sync failed:", res.status, await res.text().catch(() => ""));
    }
  } catch (error) {
    console.error("[Auth] Failed to sync user account:", error);
  }
  return null;
}

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncComplete, setSyncComplete] = useState(false);
  const { login, logout } = useAuthStore();
  const syncingRef = useRef<string | null>(null);
  const completedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isFirebaseConfigured) {
      useAuthStore.getState().setLoading(false);
      setLoading(false);
      setSyncComplete(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth(), async (user) => {
      setFirebaseUser(user);

      if (user) {
        const syncKey = user.uid;
        if (completedRef.current.has(syncKey)) {
          setLoading(false);
          setSyncComplete(true);
          return;
        }
        if (syncingRef.current === syncKey) {
          return;
        }
        syncingRef.current = syncKey;

        try {
          const token = await user.getIdToken().catch(() => null);
          setAuthCookie(token);

          if (token) {
            const backendUser = await syncUserWithBackend(token, user.displayName);

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

          useCartStore.getState().syncFromServer().catch((err) => console.error("[Auth] Cart sync failed:", err));
          useWishlistStore.getState().syncFromServer().catch((err) => console.error("[Auth] Wishlist sync failed:", err));
          completedRef.current.add(syncKey);
        } catch (error) {
          console.error("Auth sync failed:", error);
          login({
            id: user.uid,
            email: user.email || undefined,
            name: user.displayName || user.email?.split("@")[0] || "User",
            phone: user.phoneNumber || "",
            role: "customer",
          });
          completedRef.current.add(syncKey);
        } finally {
          setSyncComplete(true);
          setLoading(false);
        }
      } else {
        setAuthCookie(null);
        logout();
        setSyncComplete(true);
        setLoading(false);
        syncingRef.current = null;
        completedRef.current.clear();
      }
    });

    return () => unsubscribe();
  }, [login, logout]);

  return (
    <AuthContext.Provider value={{ user: firebaseUser, loading, syncComplete }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  return useContext(AuthContext);
}