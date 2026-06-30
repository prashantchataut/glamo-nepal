import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Enable the Cloudflare Workers context in `next dev` so the service binding
// (`API_WORKER`) is reachable locally. This is a no-op in production and on
// non-CF runtimes (Vercel) — it only runs during local development.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  outputFileTracingExcludes: {
    "**/*": ["node_modules/.pnpm/**"]
  },
  serverExternalPackages: [
    "@libsql/client",
    "libsql",
    "@libsql/hrana-client",
    "@libsql/isomorphic-fetch",
    "@libsql/isomorphic-ws",
  ],
  images: {
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "img.freepik.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
