import { spawn } from "node:child_process";
import http from "node:http";

const tail = spawn("npx", ["wrangler", "tail", "--format", "json", "glamo-nepal"], {
  cwd: process.cwd(),
  shell: true,
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, NO_COLOR: "1" },
});

let output = "";

tail.stdout.on("data", (d) => {
  output += d.toString();
  const lines = output.split("\n").filter(l => l.trim());
  for (const line of lines.slice(-5)) {
    try { JSON.parse(line); console.log("TAIL_EVENT:", line); } catch {}
  }
});

tail.stderr.on("data", (d) => {
  const s = d.toString().trim();
  if (s) console.error("TAIL_ERR:", s);
});

// Make request after 8 seconds
setTimeout(() => {
  console.error("Making request...");
  http.get("http://glamo-nepal.prashantchataut8.workers.dev", (res) => {
    let body = "";
    res.on("data", (c) => body += c);
    res.on("end", () => {
      console.error("HTTP STATUS:", res.statusCode);
      console.error("HTTP BODY:", body.substring(0, 500));
    });
  });
}, 8000);

// Timeout and print whatever we got
setTimeout(() => {
  console.log("=== FINAL OUTPUT ===");
  console.log(output.substring(0, 5000));
  tail.kill();
  process.exit(0);
}, 30000);
