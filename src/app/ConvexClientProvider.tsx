"use client";

import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { useMemo, type ReactNode } from "react";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[ConvexClientProvider] NEXT_PUBLIC_CONVEX_URL is not set. " +
          "Convex features will be unavailable. Set it in .env.local or your hosting dashboard.",
        );
      }
      return null;
    }
    return new ConvexReactClient(url);
  }, []);

  if (!client) {
    return <>{children}</>;
  }

  return (
    <ConvexAuthProvider client={client}>
      {children}
    </ConvexAuthProvider>
  );
}