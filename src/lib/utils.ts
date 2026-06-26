import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Deterministic NPR formatter.
 *
 * The previous implementation used `Intl.NumberFormat("en-NP", { style:
 * "currency", currency: "NPR" })`. The `en-NP` locale is NOT in the ICU
 * data set used by Node.js / Vercel / Cloudflare Workers in every runtime,
 * which means the server and the browser produced DIFFERENT strings for
 * the same number. That triggered React hydration error #418 on every
 * product page, cart, and checkout — the exact error the client has been
 * seeing for weeks.
 *
 * This implementation is 100% deterministic: it manually formats the
 * number with the Indian/Nepali digit-grouping convention (rightmost
 * group of 3, then groups of 2) and prepends the Devanagari rupee sign.
 * Output is identical on server and client, eliminating #418.
 *
 * Examples: 1250 → "रू 1,250" | 150000 → "रू 1,50,000" | 0 → "रू 0"
 */
export function formatNPR(value: number): string {
  if (!Number.isFinite(value)) value = 0;
  const negative = value < 0;
  const abs = Math.abs(Math.round(value));
  const digits = abs.toString();

  // Indian/Nepali numbering: last 3 digits, then groups of 2.
  let grouped: string;
  if (digits.length <= 3) {
    grouped = digits;
  } else {
    const lastThree = digits.slice(-3);
    const rest = digits.slice(0, -3);
    const restGroups: string[] = [];
    for (let i = rest.length; i > 0; i -= 2) {
      restGroups.unshift(rest.slice(Math.max(0, i - 2), i));
    }
    grouped = `${restGroups.join(",")},${lastThree}`;
  }

  return `${negative ? "-" : ""}रू ${grouped}`;
}

export function absoluteUrl(path = "") {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return `${siteUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}
