import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const scanRoots = [
  "src",
  "public",
  "FRONTEND_HANDOFF.md",
  "FINAL_CHANGELOG.md",
  "NEXT_STEPS_FOR_OWNER.md",
  "docs/PRODUCT_DATA_GUIDE.md",
  "DEPLOYMENT_CHECKLIST.md",
].map((item) => join(root, item));

const storefrontRoots = [join(root, "src/app"), join(root, "src/components"), join(root, "public")];
const textExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".mjs", ".css", ".svg", ".txt", ".html"]);
const required = [
  ["Instagram URL", "https://www.instagram.com/glamo_nepal/"],
  ["Instagram handle", "@glamo_nepal"],
  ["Phone", "+977 9818212188"],
  ["Address", "Naya Baneshwor, Mantra In & Out Square, Kathmandu, Nepal"],
];
const forbiddenAssets = [/images\.unsplash\.com/i, /cdn\.daraz/i, /jeevee.*\.(jpg|jpeg|png|webp)/i, /beautynepal.*\.(jpg|jpeg|png|webp)/i, /dihho.*\.(jpg|jpeg|png|webp)/i, /foreveryng.*\.(jpg|jpeg|png|webp)/i];
const storefrontForbidden = [/frontend-only/i, /\bmock\b/i, /config-driven/i, /handoff/i, /backend-ready/i, /source\/audit/i, /production warning/i, /\bbackend\b/i, /\bfrontend\b/i, /\bdraft\b/i, /supplier-approved/i, /Dashain/i];
const storefrontAllow = [
  "src/app/admin/",
  "src/components/admin/",
  "src/app/api/",
  "src/middleware.ts",
];
const files = [];

function walk(target) {
  try {
    const stat = statSync(target);
    if (stat.isDirectory()) {
      for (const entry of readdirSync(target)) {
        if (["node_modules", ".next", "dist", "build", ".turbo"].includes(entry)) continue;
        walk(join(target, entry));
      }
      return;
    }
    if (textExtensions.has(extname(target))) files.push(target);
  } catch {
    // Optional docs may not exist in earlier zips.
  }
}

function isStorefrontFile(file) {
  const rel = relative(root, file).replaceAll("\\", "/");
  const inStorefrontRoot = storefrontRoots.some((dir) => file.startsWith(dir));
  const allowed = storefrontAllow.some((prefix) => rel.startsWith(prefix));
  return inStorefrontRoot && !allowed;
}

scanRoots.forEach(walk);
const bodies = files.map((file) => [file, readFileSync(file, "utf8")]);
const text = bodies.map(([, body]) => body).join("\n");

for (const [label, value] of required) {
  if (!text.includes(value)) {
    console.error(`[FAIL] Missing ${label}: ${value}`);
    process.exit(1);
  }
}
for (const [file, body] of bodies) {
  const rel = relative(root, file).replaceAll("\\", "/");
  const isConfigFile = rel === "src/middleware.ts" || rel === "next.config.mjs" || rel === "src/app/layout.tsx";
  for (const pattern of forbiddenAssets) {
    if (pattern.test(body) && !isConfigFile) {
      console.error(`[FAIL] Potential competitor/hotlinked asset in ${rel}`);
      process.exit(1);
    }
  }
  if (isStorefrontFile(file)) {
    for (const pattern of storefrontForbidden) {
      if (pattern.test(body)) {
        console.error(`[FAIL] Customer-facing technical copy (${pattern}) in ${file.replace(root + "/", "")}`);
        process.exit(1);
      }
    }
  }
}
console.log(`[OK] Content safety checks passed across ${files.length} text files.`);
process.exit(0);
