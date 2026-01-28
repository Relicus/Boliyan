import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Fix monorepo build tracing - must match turbopack.root */
  outputFileTracingRoot: path.join(__dirname, "../../"),
  /* Fix monorepo module resolution for Turbopack */
  turbopack: {
    root: path.join(__dirname, "../../"),
  },
  /* Allow cross-origin requests from local network devices */
  allowedDevOrigins: [
    "http://192.168.18.35:3000",
    "http://192.168.18.125:3000",
    "http://100.64.100.6:3000",
    "http://localhost:3000",
    "http://0.0.0.0:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "pub-dffb7782d4344c16b7dbd3e485e5f3a2.r2.dev",
      },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        aggregateTimeout: 2500,
      };
    }
    return config;
  },
};

export default nextConfig;
