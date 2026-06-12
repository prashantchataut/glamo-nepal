"use client";

import { useEffect } from "react";
import { getCsrfToken, setCsrfToken } from "@/lib/csrf";

export function CsrfBootstrap() {
  useEffect(() => {
    if (getCsrfToken()) return;
    fetch("/api/csrf", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return;
        const token = res.headers.get("x-csrf-token");
        if (token) { setCsrfToken(token); return; }
        const data = await res.json();
        if (data?.csrfToken) setCsrfToken(data.csrfToken);
      })
      .catch(() => { /* silently fail — form submissions will prompt refresh */ });
  }, []);

  return null;
}
