import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The public trycloudflare.com link must be allowed or the dev server
  // refuses its scripts and the shared page stays blank.
  allowedDevOrigins: ["*.trycloudflare.com"],
  cacheComponents: true,
  // blog covers live in Supabase storage (and older ones on netkathir.com); next/image resizes + converts them
  images: {
    remotePatterns: [
      new URL(`${(process.env.SUPABASE_URL || "https://yrotykqehbskivuuyzvq.supabase.co").replace(/\/$/, "")}/storage/v1/object/public/**`),
      new URL("https://netkathir.com/images/**"),
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // `next dev` serves the original files (some local networks resolve Supabase to NAT64 addresses, which the
    // optimizer refuses as private); production builds, e.g. on Vercel, resize and convert them
    unoptimized: process.env.NODE_ENV !== "production",
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
