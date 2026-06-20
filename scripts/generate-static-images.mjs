/**
 * One-off generator: renders brand images (OG, Twitter, icon, apple-icon) as
 * static PNGs. Replaces the dynamic next/og ImageResponse generators that broke
 * the OpenNext Cloudflare build due to a Windows + spaces-in-path + pnpm wasm
 * asset path mangling bug (@vercel/og -> resvg.wasm/yoga.wasm).
 *
 * Run: node scripts/generate-static-images.mjs
 */
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "node:fs";

const OUT_DIR = "src/app";
mkdirSync(OUT_DIR, { recursive: true });

// Build an SVG, then rasterize to PNG at the target size (sharp handles resize).
function raster(svg, width, height, outFile) {
  sharp(Buffer.from(svg), { density: 384 })
    .resize(width, height)
    .png()
    .toFile(outFile)
    .then(() => console.log(`wrote ${outFile} (${width}x${height})`))
    .catch((e) => {
      console.error(`failed ${outFile}:`, e);
      process.exit(1);
    });
}

const OG_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a1a1a"/>
      <stop offset="50%" stop-color="#2d1b2e"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="540" y="120" width="120" height="120" rx="28" fill="#8B3A8F"/>
  <text x="600" y="208" text-anchor="middle" font-family="Georgia, serif" font-size="72" font-weight="700" fill="white">G</text>
  <text x="600" y="360" text-anchor="middle" font-family="Georgia, serif" font-size="64" font-weight="700" letter-spacing="3" fill="white">GLAMO NEPAL</text>
  <text x="600" y="416" text-anchor="middle" font-family="Georgia, serif" font-size="28" letter-spacing="4" fill="#c4a882">PREMIUM BEAUTY &amp; SKINCARE</text>
  <text x="600" y="480" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#888888">Kathmandu, Nepal</text>
</svg>`;

raster(OG_SVG, 1200, 630, `${OUT_DIR}/opengraph-image.png`);
raster(OG_SVG, 1200, 630, `${OUT_DIR}/twitter-image.png`);

const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="8" fill="#8B3A8F"/>
  <text x="16" y="23" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="700" fill="white">G</text>
</svg>`;

raster(ICON_SVG, 32, 32, `${OUT_DIR}/icon.png`);

const APPLE_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="40" fill="#8B3A8F"/>
  <text x="90" y="128" text-anchor="middle" font-family="Georgia, serif" font-size="100" font-weight="700" fill="white">G</text>
</svg>`;

raster(APPLE_ICON_SVG, 180, 180, `${OUT_DIR}/apple-icon.png`);
