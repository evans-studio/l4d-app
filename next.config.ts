/**
 * Simplified Next.js Configuration for Love4Detailing
 * 
 * Minimal configuration to fix build issues while maintaining
 * essential security and performance features.
 */

/** @type {import('next').NextConfig} */
const baseConfig = {
  // Build configuration
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Experimental features for better performance
  experimental: {
    // optimizeCss: true, // Disabled due to critters dependency issue
  },
  
  // Image configuration
  images: {
    domains: ['images.unsplash.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Security headers (simplified)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Webpack configuration for build fixes
  webpack: (config: any, { buildId, dev, isServer, defaultLoaders, webpack }: any) => {
    // Fix for potential webpack errors
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Optimize chunks
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        default: {
          minChunks: 1,
          priority: -20,
          reuseExistingChunk: true,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          reuseExistingChunk: true,
        },
      }
    }

    return config
  },
}

// Wrap with Sentry if available
let nextConfig = baseConfig as any
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { withSentryConfig } = require('@sentry/nextjs')
  nextConfig = withSentryConfig(baseConfig, {
    silent: true,
    widenClientFileUpload: true,
  })
} catch (_) {
  // Sentry not installed or not available at build time
}

export default nextConfig
