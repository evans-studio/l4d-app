import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Temporarily disable ESLint during builds for Vercel deployment
  // TypeScript checking remains enabled for safety
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
