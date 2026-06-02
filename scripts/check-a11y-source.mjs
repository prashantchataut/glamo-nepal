import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src");
const issues = [];
const extensions = new Set([".tsx", ".jsx"]);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name))) checkFile(full);
  }
}

function lineFor(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function collectOpeningTags(source, tagName) {
  const tags = [];
  const regex = new RegExp(`<${tagName}(?:\\s|>|\\/)`, "g");
  let match;
  while ((match = regex.exec(source)) !== null) {
    const start = match.index;
    const end = source.indexOf(">", start);
    if (end === -1) continue;
    tags.push({ text: source.slice(start, end + 1), index: start });
  }
  return tags;
}

function checkFile(file) {
  const rel = path.relative(process.cwd(), file);
  const source = fs.readFileSync(file, "utf8");
  for (const tag of collectOpeningTags(source, "Image")) {
    if (!/\balt\s*=/.test(tag.text)) issues.push(`${rel}:${lineFor(source, tag.index)}: Image missing alt text.`);
  }
  for (const tag of collectOpeningTags(source, "a")) {
    if (/target\s*=\s*"_blank"/.test(tag.text) && !/rel\s*=\s*"noopener noreferrer"/.test(tag.text)) {
      issues.push(`${rel}:${lineFor(source, tag.index)}: target=_blank link missing rel noopener noreferrer.`);
    }
  }
  for (const tag of collectOpeningTags(source, "button")) {
    const start = tag.index;
    const close = source.indexOf("</button>", start);
    if (close === -1) continue;
    const inner = source.slice(tag.index + tag.text.length, close).replace(/<[^>]*>/g, "").replace(/[{}()?:.,;'"`]/g, "").trim();
    const hasAccessibleName = /aria-label\s*=|title\s*=/.test(tag.text) || inner.length > 0;
    if (!hasAccessibleName) issues.push(`${rel}:${lineFor(source, tag.index)}: button may be missing accessible name.`);
  }
}

walk(root);
if (issues.length) {
  console.error("[FAIL] Accessibility source check failed:");
  issues.slice(0, 50).forEach((issue) => console.error(`- ${issue}`));
  if (issues.length > 50) console.error(`...and ${issues.length - 50} more.`);
  process.exit(1);
}
console.log("[OK] Accessibility source check passed.");
process.exit(0);
