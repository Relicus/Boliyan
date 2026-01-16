import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Allow cross-origin requests from local network devices */
  allowedDevOrigins: [
    "http://192.168.18.125:3000",
    "http://100.64.100.6:3000",
    "http://localhost:3000",
  ],
};

export default nextConfig;
