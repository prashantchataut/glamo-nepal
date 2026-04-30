const fs = require("node:fs");

const required = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_KHALTI_PUBLIC_KEY",
  "NEXT_PUBLIC_ESEWA_MERCHANT_ID",
  "NEXT_PUBLIC_API_BASE_URL",
  "NEXT_PUBLIC_GOOGLE_ANALYTICS_ID",
  "NEXT_PUBLIC_FACEBOOK_URL",
  "NEXT_PUBLIC_INSTAGRAM_URL",
];
const text = fs.readFileSync(".env.example", "utf8");
const missing = required.filter((key) => !new RegExp(`^${key}=`, "m").test(text));
if (missing.length) {
  console.error(`[FAIL] .env.example missing: ${missing.join(", ")}`);
  process.exit(1);
}
if (!text.includes("https://www.instagram.com/glamo_nepal/")) {
  console.error("[FAIL] .env.example must include correct Instagram URL.");
  process.exit(1);
}
console.log("[OK] Environment example check passed.");
