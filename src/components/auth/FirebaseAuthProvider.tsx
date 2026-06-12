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
import { csrfHeaders, setCsrfToken } from "@/lib/csrf";

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

function normalizeRole(role?: string): "customer" | "admin" {
  if (!role) return "customer";
  const lower = role.toLowerCase();
  if (lower === "admin") return "admin";
  return "customer";
}

const _globalCompletedSyncs = new Set<string>();

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
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...csrfHeaders(),
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });
    const csrfToken = res.headers.get("x-csrf-token");
    if (csrfToken) setCsrfToken(csrfToken);
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

  useEffect(() => {
    if (!isFirebaseConfigured) {
      useAuthStore.getState().setLoading(false);
      setLoading(false);
      setSyncComplete(true);
      return;
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("[Global] Unhandled promise rejection:", event.reason);
      if (event.reason instanceof Error && event.reason.message?.includes("Connection closed")) {
        return;
      }
    };
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    const unsubscribe = onAuthStateChanged(auth(), async (user) => {
      setFirebaseUser(user);

      if (user) {
        const syncKey = user.uid;
        if (_globalCompletedSyncs.has(syncKey)) {
          setLoading(false);
          setSyncComplete(true);
          return;
        }
        if (syncingRef.current === syncKey) {
          return;
        }
        syncingRef.current = syncKey;

        try {
          const token = await user.getIdToken().catch((err) => {
            console.error("[Auth] Failed to get ID token:", err);
            return null;
          });
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
                role: normalizeRole(backendUser.role),
              });
            } else {
              console.warn("[Auth] Backend sync failed, using Firebase-only user data");
              login({
                id: user.uid,
                email: user.email || undefined,
                name: user.displayName || user.email?.split("@")[0] || "User",
                phone: user.phoneNumber || "",
                role: "customer",
              });
            }
          } else {
            console.warn("[Auth] No ID token available, using Firebase-only user data");
            login({
              id: user.uid,
              email: user.email || undefined,
              name: user.displayName || user.email?.split("@")[0] || "User",
              phone: user.phoneNumber || "",
              role: "customer",
            });
          }

          const syncCart = async (retries = 1) => {
            for (let attempt = 0; attempt <= retries; attempt++) {
              try {
                await useCartStore.getState().syncFromServer();
                return;
              } catch (err) {
                if (attempt === retries) console.error("[Auth] Cart sync failed:", err);
                else await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
              }
            }
          };
          const syncWishlist = async (retries = 1) => {
            for (let attempt = 0; attempt <= retries; attempt++) {
              try {
                await useWishlistStore.getState().syncFromServer();
                return;
              } catch (err) {
                if (attempt === retries) console.error("[Auth] Wishlist sync failed:", err);
                else await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
              }
            }
          };
          syncCart();
          syncWishlist();
          _globalCompletedSyncs.add(syncKey);
        } catch (error) {
          console.error("Auth sync failed:", error);
          login({
            id: user.uid,
            email: user.email || undefined,
            name: user.displayName || user.email?.split("@")[0] || "User",
            phone: user.phoneNumber || "",
            role: "customer",
          });
          _globalCompletedSyncs.add(syncKey);
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
        _globalCompletedSyncs.clear();
      }
    });

    return () => {
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
      unsubscribe();
    };
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