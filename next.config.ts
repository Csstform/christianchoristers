import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Public album audio uploads go through server actions (25MB app limit).
    serverActions: {
      bodySizeLimit: "26mb",
    },
  },
};

export default nextConfig;
