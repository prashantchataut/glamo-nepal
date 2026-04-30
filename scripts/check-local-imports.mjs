import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";

const root = process.cwd();
const files = [];
const extensions = [".ts", ".tsx", ".js", ".jsx"];
const candidates = ["", ".ts", ".tsx", ".js", ".jsx", "/index.ts", "/index.tsx", "/index.js", "/index.jsx"];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (["node_modules", ".next", "dist", "build", ".turbo"].includes(entry)) continue;
      walk(full);
      continue;
    }
    if (extensions.includes(extname(entry))) files.push(full);
  }
}

function resolveImport(spec, file) {
  if (spec.startsWith("@/")) return join(root, "src", spec.slice(2));
  if (spec.startsWith("./") || spec.startsWith("../")) return resolve(dirname(file), spec);
  return null;
}

walk(join(root, "src"));
const missing = [];
const importRe = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?from\s+)?["']([^"']+)["']/g;

for (const file of files) {
  const source = readFileSync(file, "utf8");
  let match;
  while ((match = importRe.exec(source))) {
    const base = resolveImport(match[1], file);
    if (!base) continue;
    if (!candidates.some((suffix) => existsSync(base + suffix))) {
      missing.push(`${file.replace(root + "/", "")}: ${match[1]}`);
    }
  }
}

if (missing.length) {
  console.error("[FAIL] Missing local imports:");
  for (const item of missing) console.error(`  ${item}`);
  process.exit(1);
}

console.log(`[OK] ${files.length} source files checked; local imports resolve.`);
process.exit(0);
