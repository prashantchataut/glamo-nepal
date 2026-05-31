"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface StatusPillProps {
  children: ReactNode;
  variant: "success" | "warning" | "error" | "info" | "neutral";
  className?: string;
}

const variantStyles: Record<StatusPillProps["variant"], string> = {
  success: "bg-admin-success-light text-admin-success ring-admin-success/20",
  warning: "bg-admin-warning-light text-admin-warning ring-admin-warning/20",
  error: "bg-admin-error-light text-admin-error ring-admin-error/20",
  info: "bg-admin-info-light text-admin-info ring-admin-info/20",
  neutral: "bg-admin-neutral-light text-admin-neutral ring-admin-neutral/20",
};

export function StatusPill({ children, variant, className }: StatusPillProps) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1", variantStyles[variant], className)}>
      {children}
    </span>
  );
}

export function orderStatusToVariant(status: string): StatusPillProps["variant"] {
  switch (status.toLowerCase()) {
    case "pending":
      return "warning";
    case "confirmed":
      return "info";
    case "processing":
      return "info";
    case "shipped":
      return "info";
    case "delivered":
      return "success";
    case "cancelled":
      return "error";
    default:
      return "neutral";
  }
}

export function stockStatusToVariant(status: string): StatusPillProps["variant"] {
  switch (status.toLowerCase()) {
    case "active":
    case "healthy":
    case "in stock":
      return "success";
    case "low":
    case "watch":
    case "low stock":
      return "warning";
    case "out":
    case "out of stock":
      return "error";
    default:
      return "neutral";
  }
}