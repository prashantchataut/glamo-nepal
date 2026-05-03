import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNPR(value: number) {
  return new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(value).replace("NPR", "NPR ");
}

export function absoluteUrl(path = "") {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://glamonepal.com";
  return `${siteUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}
