"use client";

import { useEffect } from "react";
import { ensureCsrfToken } from "@/lib/csrf";

export function CsrfBootstrap() {
  useEffect(() => {
    ensureCsrfToken(true).catch(() => {});
  }, []);

  return null;
}