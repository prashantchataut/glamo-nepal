import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const appDir = join(process.cwd(), "src", "app");
const routeFiles = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }
    if (entry === "page.tsx" || entry === "page.ts" || entry === "route.ts" || entry === "route.tsx") {
      routeFiles.push(full);
    }
  }
}

function segmentToRoute(segment) {
  if (segment.startsWith("(") && segment.endsWith(")")) return "";
  if (segment.startsWith("@")) return "";
  return segment;
}

walk(appDir);
const map = new Map();

for (const file of routeFiles) {
  const rel = relative(appDir, file).replaceAll("\\", "/");
  const parts = rel.split("/").slice(0, -1).map(segmentToRoute).filter(Boolean);
  const route = `/${parts.join("/")}`.replace(/\/$/, "") || "/";
  const existing = map.get(route) || [];
  existing.push(rel);
  map.set(route, existing);
}

const duplicates = [...map.entries()].filter(([, files]) => files.length > 1);
if (duplicates.length) {
  console.error("[FAIL] Duplicate App Router paths detected:");
  for (const [route, files] of duplicates) {
    console.error(`  ${route}: ${files.join(", ")}`);
  }
  process.exit(1);
}

console.log(`[OK] ${routeFiles.length} App Router entries checked; no duplicate route paths.`);
process.exit(0);
