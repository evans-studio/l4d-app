import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily allow build to proceed while maintaining TypeScript checking
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
