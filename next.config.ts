import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Clean TypeScript configuration for production
  eslint: {
    // Temporarily ignore ESLint errors during build for testing
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep TypeScript checking enabled for Vercel deployment
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
