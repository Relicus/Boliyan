import path from "node:path";
import type { NextConfig } from "next";

const repoRoot = path.resolve(__dirname, "../..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
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
      {
        protocol: "https",
        hostname: "boliyan-listings.8e7ce4e70585cc080469d856ec2b1c5e.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "wxdehgjadxlkhvfwjfxd.supabase.co",
      },
    ],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        aggregateTimeout: 300,
        // Ignore generated audit reports and database types to prevent HMR loops
        ignored: [
          "**/topology-report.json",
          "**/feature-audit-report.json",
          "**/topology-diagram.mmd",
          "**/database.types.ts",
          "**/.next/**",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
