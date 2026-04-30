import { existsSync, readFileSync } from "node:fs";

const requiredRoutes = [
  "src/app/page.tsx",
  "src/app/shop/page.tsx",
  "src/app/product/[slug]/page.tsx",
  "src/app/cart/page.tsx",
  "src/app/checkout/page.tsx",
  "src/app/checkout/success/page.tsx",
  "src/app/account/page.tsx",
  "src/app/admin/page.tsx",
  "src/app/collections/page.tsx",
  "src/app/collections/[slug]/page.tsx",
  "src/app/routines/page.tsx",
  "src/app/routines/[slug]/page.tsx",
  "src/app/brands/page.tsx",
  "src/app/brands/[slug]/page.tsx",
  "src/app/search/page.tsx",
  "src/app/blog/page.tsx",
  "src/app/blog/[slug]/page.tsx",
  "src/app/not-found.tsx",
];

const publicMetadataRoutes = [
  "src/app/page.tsx",
  "src/app/shop/page.tsx",
  "src/app/product/[slug]/page.tsx",
  "src/app/collections/page.tsx",
  "src/app/collections/[slug]/page.tsx",
  "src/app/routines/page.tsx",
  "src/app/routines/[slug]/page.tsx",
  "src/app/brands/page.tsx",
  "src/app/brands/[slug]/page.tsx",
  "src/app/search/page.tsx",
  "src/app/blog/page.tsx",
  "src/app/blog/[slug]/page.tsx",
  "src/app/about/page.tsx",
  "src/app/contact/page.tsx",
];

const missing = requiredRoutes.filter((file) => !existsSync(file));
if (missing.length) {
  console.error(`[FAIL] Missing smoke route files: ${missing.join(", ")}`);
  process.exit(1);
}

const metadataMissing = publicMetadataRoutes.filter((file) => {
  if (!existsSync(file)) return false;
  const text = readFileSync(file, "utf8");
  return !text.includes("metadata") && !text.includes("generateMetadata");
});
if (metadataMissing.length) {
  console.error(`[FAIL] Public routes missing metadata/generateMetadata: ${metadataMissing.join(", ")}`);
  process.exit(1);
}
console.log(`[OK] ${requiredRoutes.length} smoke route files checked with public metadata coverage.`);
