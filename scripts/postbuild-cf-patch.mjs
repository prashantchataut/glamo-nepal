import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const handlerPath = join(__dirname, "..", ".open-next", "server-functions", "default", "handler.mjs");

const content = readFileSync(handlerPath, "utf-8");
const patched = content.replace(
  /(customServer:!1,dev:!1,dir:"")(?=\}\))/,
  "minimalMode:!0,$1"
);

if (content !== patched) {
  writeFileSync(handlerPath, patched);
  console.log("✓ Patched handler.mjs: added minimalMode:true");
} else {
  console.log("− handler.mjs already patched, skipping");
}
