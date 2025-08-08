/**
 * Lighthouse CI Configuration for Love4Detailing
 * 
 * Automated performance testing with strict budgets
 * to ensure optimal user experience.
 */

module.exports = {
  ci: {
    collect: {
      // URLs to test
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/book',
        'http://localhost:3000/admin/login',
      ],
      
      // Test configuration
      numberOfRuns: 3,
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      
      // Lighthouse settings
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --headless',
        preset: 'desktop',
        throttling: {
          // Simulate fast 3G connection
          rttMs: 150,
          throughputKbps: 1600,
          cpuSlowdownMultiplier: 4,
          requestLatencyMs: 150,
          downloadThroughputKbps: 1600,
          uploadThroughputKbps: 750,
        },
      },
    },
    
    assert: {
      assertions: {
        // Performance category (minimum score: 90%)
        'categories:performance': ['error', { minScore: 0.90 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.90 }],
        
        // Core Web Vitals thresholds
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'interactive': ['error', { maxNumericValue: 3800 }],
        'speed-index': ['error', { maxNumericValue: 3400 }],
        'total-blocking-time': ['error', { maxNumericValue: 600 }],
        
        // Resource optimization
        'total-byte-weight': ['error', { maxNumericValue: 1000000 }], // 1MB
        'unused-javascript': ['warn', { maxNumericValue: 102400 }],   // 100KB
        'unused-css-rules': ['warn', { maxNumericValue: 20480 }],     // 20KB
        'unminified-css': 'error',
        'unminified-javascript': 'error',
        'uses-text-compression': 'error',
        'uses-responsive-images': 'warn',
        'modern-image-formats': 'warn',
        'efficient-animated-content': 'error',
        'offscreen-images': 'warn',
        'render-blocking-resources': ['warn', { maxNumericValue: 3 }],
        
        // Best practices
        'uses-https': 'error',
        'is-on-https': 'error',
        'uses-http2': 'error',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn',
        'external-anchors-use-rel-noopener': 'error',
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'button-name': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'meta-viewport': 'error',
        
        // SEO
        'meta-description': 'error',
        'document-title': 'error',
        'font-size': 'error',
        'tap-targets': 'error',
        'hreflang': 'warn',
        'canonical': 'warn',
        'robots-txt': 'warn',
        
        // PWA (warnings for future enhancement)
        'installable-manifest': 'warn',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
        'viewport': 'error',
        'without-javascript': 'warn',
        
        // Performance opportunities
        'preload-lcp-image': 'warn',
        'prioritize-lcp-image': 'warn',
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'warn',
        'font-display': 'warn',
        'non-composited-animations': 'warn',
        'unsized-images': 'warn',
      },
      
      // Budget assertions (in addition to individual metrics)
      budget: [
        {
          path: '/*',
          resourceSizes: [
            { resourceType: 'document', budget: 18000 },      // 18KB HTML
            { resourceType: 'stylesheet', budget: 51200 },    // 50KB CSS
            { resourceType: 'script', budget: 307200 },       // 300KB JS
            { resourceType: 'image', budget: 512000 },        // 500KB images
            { resourceType: 'font', budget: 204800 },         // 200KB fonts
            { resourceType: 'other', budget: 102400 },        // 100KB other
            { resourceType: 'total', budget: 1048576 },       // 1MB total
          ],
          resourceCounts: [
            { resourceType: 'document', budget: 1 },
            { resourceType: 'stylesheet', budget: 4 },
            { resourceType: 'script', budget: 10 },
            { resourceType: 'image', budget: 15 },
            { resourceType: 'font', budget: 4 },
            { resourceType: 'third-party', budget: 5 },
            { resourceType: 'total', budget: 50 },
          ],
          timings: [
            { metric: 'first-contentful-paint', budget: 1800 },
            { metric: 'largest-contentful-paint', budget: 2500 },
            { metric: 'speed-index', budget: 3400 },
            { metric: 'interactive', budget: 3800 },
          ],
        },
      ],
    },
    
    upload: {
      // Store results temporarily for CI
      target: 'temporary-public-storage',
    },
    
    server: {
      // Optional: Configure server for viewing results
      port: 9001,
      storage: {
        storageMethod: 'filesystem',
        storagePath: '.lighthouseci',
      },
    },
  },
}