import { existsSync, readFileSync } from "node:fs";

const requiredRoutes = [
  "src/app/page.tsx",
  "src/app/(public)/shop/page.tsx",
  "src/app/(public)/product/[slug]/page.tsx",
  "src/app/(public)/cart/page.tsx",
  "src/app/(public)/checkout/page.tsx",
  "src/app/(public)/checkout/success/page.tsx",
  "src/app/account/page.tsx",
  "src/app/admin/page.tsx",
  "src/app/(public)/collections/page.tsx",
  "src/app/(public)/collections/[slug]/page.tsx",
  "src/app/(public)/routines/page.tsx",
  "src/app/(public)/routines/[slug]/page.tsx",
  "src/app/(public)/brands/page.tsx",
  "src/app/(public)/brands/[slug]/page.tsx",
  "src/app/(public)/search/page.tsx",
  "src/app/(public)/blog/page.tsx",
  "src/app/(public)/blog/[slug]/page.tsx",
  "src/app/not-found.tsx",
];

const publicMetadataRoutes = [
  "src/app/page.tsx",
  "src/app/(public)/shop/page.tsx",
  "src/app/(public)/product/[slug]/page.tsx",
  "src/app/(public)/collections/page.tsx",
  "src/app/(public)/collections/[slug]/page.tsx",
  "src/app/(public)/routines/page.tsx",
  "src/app/(public)/routines/[slug]/page.tsx",
  "src/app/(public)/brands/page.tsx",
  "src/app/(public)/brands/[slug]/page.tsx",
  "src/app/(public)/search/page.tsx",
  "src/app/(public)/blog/page.tsx",
  "src/app/(public)/blog/[slug]/page.tsx",
  "src/app/(public)/about/page.tsx",
  "src/app/(public)/contact/page.tsx",
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
