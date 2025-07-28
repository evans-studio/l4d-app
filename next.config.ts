import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production-ready configuration with full compliance
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
