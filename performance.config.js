/**
 * Performance Budget Configuration for Love4Detailing
 * 
 * Defines performance budgets and enforcement rules to ensure
 * optimal user experience and prevent performance regressions.
 */

// Performance budget thresholds
const PERFORMANCE_BUDGETS = {
  // Bundle size budgets (in bytes)
  bundles: {
    // Main JavaScript bundle (First Load JS)
    mainBundle: 250 * 1024,        // 250 KB
    // Total First Load JS shared by all pages
    firstLoadJS: 300 * 1024,       // 300 KB
    // Individual page bundles
    pageBundle: 150 * 1024,        // 150 KB per page
    // CSS bundles
    cssBundle: 50 * 1024,          // 50 KB total CSS
    // Static assets
    images: 500 * 1024,            // 500 KB per image
    fonts: 200 * 1024,             // 200 KB total fonts
  },

  // Core Web Vitals budgets (in milliseconds)
  webVitals: {
    // Largest Contentful Paint
    lcp: {
      good: 2500,
      needsImprovement: 4000,
    },
    // First Input Delay  
    fid: {
      good: 100,
      needsImprovement: 300,
    },
    // Cumulative Layout Shift (unitless)
    cls: {
      good: 0.1,
      needsImprovement: 0.25,
    },
    // First Contentful Paint
    fcp: {
      good: 1800,
      needsImprovement: 3000,
    },
    // Time to Interactive
    tti: {
      good: 3800,
      needsImprovement: 7300,
    },
  },

  // Network performance budgets
  network: {
    // API response times (in milliseconds)
    apiResponseTime: 500,
    // Database query time
    dbQueryTime: 100,
    // Image load time
    imageLoadTime: 2000,
    // Font load time  
    fontLoadTime: 1000,
  },

  // Resource counts
  resources: {
    // Maximum number of HTTP requests
    maxRequests: 50,
    // Maximum DOM nodes
    maxDOMNodes: 1500,
    // Maximum number of third-party scripts
    maxThirdPartyScripts: 5,
    // Maximum render blocking resources
    maxRenderBlockingResources: 3,
  },
}

// Lighthouse CI configuration
const LIGHTHOUSE_CONFIG = {
  ci: {
    collect: {
      url: ['http://localhost:3000/', 'http://localhost:3000/book'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        // Performance score threshold
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],

        // Core Web Vitals
        'largest-contentful-paint': ['error', { maxNumericValue: PERFORMANCE_BUDGETS.webVitals.lcp.good }],
        'first-input-delay': ['error', { maxNumericValue: PERFORMANCE_BUDGETS.webVitals.fid.good }],
        'cumulative-layout-shift': ['error', { maxNumericValue: PERFORMANCE_BUDGETS.webVitals.cls.good }],
        'first-contentful-paint': ['error', { maxNumericValue: PERFORMANCE_BUDGETS.webVitals.fcp.good }],
        'interactive': ['error', { maxNumericValue: PERFORMANCE_BUDGETS.webVitals.tti.good }],

        // Resource budgets
        'total-byte-weight': ['error', { maxNumericValue: 1000 * 1024 }], // 1MB total
        'unused-javascript': ['warn', { maxNumericValue: 100 * 1024 }],   // 100KB unused JS
        'unused-css-rules': ['warn', { maxNumericValue: 20 * 1024 }],     // 20KB unused CSS
        'modern-image-formats': 'error',
        'efficient-animated-content': 'error',
        'offscreen-images': 'warn',

        // Best practices
        'uses-webp-images': 'warn',
        'uses-optimized-images': 'warn',
        'uses-text-compression': 'error',
        'uses-responsive-images': 'warn',
        'preload-lcp-image': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}

// Webpack bundle analyzer configuration
const BUNDLE_ANALYZER_CONFIG = {
  analyze: process.env.ANALYZE === 'true',
  budgets: [
    {
      type: 'initial',
      maximumWarning: PERFORMANCE_BUDGETS.bundles.firstLoadJS,
      maximumError: PERFORMANCE_BUDGETS.bundles.firstLoadJS * 1.2,
    },
    {
      type: 'anyComponentStyle',
      maximumWarning: PERFORMANCE_BUDGETS.bundles.cssBundle,
      maximumError: PERFORMANCE_BUDGETS.bundles.cssBundle * 1.2,
    },
    {
      type: 'any',
      maximumWarning: PERFORMANCE_BUDGETS.bundles.pageBundle,
      maximumError: PERFORMANCE_BUDGETS.bundles.pageBundle * 1.2,
    },
  ],
}

// Performance monitoring configuration
const MONITORING_CONFIG = {
  // Real User Monitoring (RUM) thresholds
  rum: {
    sampleRate: 0.1, // Sample 10% of users
    thresholds: PERFORMANCE_BUDGETS.webVitals,
  },

  // Synthetic monitoring
  synthetic: {
    interval: 60000, // Check every minute
    timeout: 30000,  // 30 second timeout
    urls: [
      '/',
      '/book',
      '/api/health',
    ],
  },

  // Alert thresholds
  alerts: {
    // Trigger alert if metrics exceed these values
    lcp: PERFORMANCE_BUDGETS.webVitals.lcp.needsImprovement,
    fid: PERFORMANCE_BUDGETS.webVitals.fid.needsImprovement,
    cls: PERFORMANCE_BUDGETS.webVitals.cls.needsImprovement,
    apiResponseTime: PERFORMANCE_BUDGETS.network.apiResponseTime * 2,
  },
}

module.exports = {
  PERFORMANCE_BUDGETS,
  LIGHTHOUSE_CONFIG,
  BUNDLE_ANALYZER_CONFIG,
  MONITORING_CONFIG,
}