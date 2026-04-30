import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const sourceFiles = [];
function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (["node_modules", ".next", "dist", "build", ".turbo"].includes(entry)) continue;
      walk(full);
      continue;
    }
    if ([".ts", ".tsx", ".js", ".jsx"].includes(extname(full))) sourceFiles.push(full);
  }
}
walk("src");

const issues = [];
for (const file of sourceFiles) {
  const text = readFileSync(file, "utf8");
  if (/https:\/\/(images\.unsplash\.com|plus\.unsplash\.com|static-01\.daraz\.com|cdn\.shopify\.com)/i.test(text)) issues.push(`${file}: external product image/source hotlink`);
  if (/console\.(log|debug)\(/.test(text)) issues.push(`${file}: console logging left in source`);
}
if (issues.length) {
  console.error("[FAIL] Performance/source hygiene issues:");
  for (const issue of issues) console.error(`  ${issue}`);
  process.exit(1);
}
console.log(`[OK] ${sourceFiles.length} source files checked for image hotlinks and console debug output.`);
