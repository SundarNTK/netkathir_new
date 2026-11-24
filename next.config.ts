import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The public trycloudflare.com link must be allowed or the dev server
  // refuses its scripts and the shared page stays blank.
  allowedDevOrigins: ["*.trycloudflare.com"],
  cacheComponents: true,
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
