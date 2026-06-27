import { spawnSync } from "child_process";
import { writeFileSync } from "fs";

// Start wrangler tail in background
const tail = spawnSync("npx", ["wrangler", "tail", "--format", "json"], {
  cwd: process.cwd(),
  shell: true,
  timeout: 30000,
  stdio: ["ignore", "pipe", "pipe"],
});

console.log("TAIL STDOUT:", tail.stdout.toString().substring(0, 10000));
console.log("TAIL STDERR:", tail.stderr.toString().substring(0, 10000));
