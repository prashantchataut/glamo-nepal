import fs from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "src/lib/data/catalog-products.ts");
const text = fs.readFileSync(file, "utf8");
const productBlocks = [...text.matchAll(/product\(\{([\s\S]*?)\}\),/g)].map((match) => match[1]);
const requiredFields = ["id", "name", "slug", "sku", "brand", "category", "subCategory", "price", "image", "rating", "reviewsCount", "skinType", "concernTags", "benefits", "howToUse", "ingredients", "size", "origin", "madeInNepal", "stockCount", "description"];
const issues = [];
const seenSlugs = new Set();
const seenSkus = new Set();

if (productBlocks.length < 40) issues.push(`Expected at least 40 catalog products, found ${productBlocks.length}.`);

productBlocks.forEach((block, index) => {
  const label = `Product ${index + 1}`;
  requiredFields.forEach((field) => {
    if (!new RegExp(`${field}\\s*:`).test(block)) issues.push(`${label} is missing ${field}.`);
  });
  const slug = block.match(/slug:\s*"([^"]+)"/)?.[1];
  const sku = block.match(/sku:\s*"([^"]+)"/)?.[1];
  const price = Number(block.match(/price:\s*(\d+)/)?.[1]);
  const stock = Number(block.match(/stockCount:\s*(\d+)/)?.[1]);
  const image = block.match(/image:\s*`?([^`,]+)`?/)?.[1] || "";
  if (slug) {
    if (seenSlugs.has(slug)) issues.push(`Duplicate slug: ${slug}.`);
    seenSlugs.add(slug);
  }
  if (sku) {
    if (seenSkus.has(sku)) issues.push(`Duplicate SKU: ${sku}.`);
    seenSkus.add(sku);
  }
  if (!Number.isFinite(price) || price <= 0) issues.push(`${label} has invalid price.`);
  if (!Number.isFinite(stock) || stock < 0) issues.push(`${label} has invalid stockCount.`);
  if (/https?:\/\//i.test(image)) issues.push(`${label} image appears to be a remote URL.`);
});

if (!text.includes("CATALOG_REFERENCE_NOTES")) issues.push("Missing Nepal-market reference notes.");
if (!text.includes("Supplier-approved")) issues.push("Missing supplier approval warning in catalog notes.");

if (issues.length) {
  console.error("[FAIL] Product data check failed:");
  issues.forEach((issue) => console.error(`- ${issue}`));
  process.exit(1);
}
console.log(`[OK] Product data check passed across ${productBlocks.length} catalog products.`);
process.exit(0);
