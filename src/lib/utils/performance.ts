import { logger } from '@/lib/utils/logger'
/**
 * Performance Monitoring Utilities for Love4Detailing
 * 
 * Provides client-side performance monitoring, metrics collection,
 * and Core Web Vitals tracking for production optimization.
 */

// import { reportMessage } from '../../../sentry.client.config'

// Performance thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  // Core Web Vitals
  LCP_GOOD: 2500,        // Largest Contentful Paint
  LCP_NEEDS_IMPROVEMENT: 4000,
  FID_GOOD: 100,         // First Input Delay
  FID_NEEDS_IMPROVEMENT: 300,
  CLS_GOOD: 0.1,         // Cumulative Layout Shift
  CLS_NEEDS_IMPROVEMENT: 0.25,
  
  // Custom metrics
  PAGE_LOAD: 3000,       // Target page load time
  API_RESPONSE: 500,     // Target API response time
  BOOKING_FLOW: 10000,   // Maximum booking flow time
}

// Performance metric types
export type PerformanceMetric = {
  name: string
  value: number
  timestamp: number
  url: string
  userAgent: string
  connectionType?: string
}

// Core Web Vitals tracking
export class WebVitalsTracker {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private isEnabled: boolean

  constructor() {
    this.isEnabled = typeof window !== 'undefined' && 'performance' in window
    
    if (this.isEnabled) {
      this.initializeTracking()
    }
  }

  private initializeTracking() {
    // Track Core Web Vitals when they become available
    if (typeof window !== 'undefined') {
      // Use dynamic import to avoid SSR issues (disabled temporarily for build)
      // import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      //   getCLS(this.handleMetric.bind(this, 'CLS'))
      //   getFID(this.handleMetric.bind(this, 'FID'))
      //   getFCP(this.handleMetric.bind(this, 'FCP'))
      //   getLCP(this.handleMetric.bind(this, 'LCP'))
      //   getTTFB(this.handleMetric.bind(this, 'TTFB'))
      // }).catch(() => {
      //   // Fallback if web-vitals is not available
      //   this.initializeFallbackTracking()
      // })
      
      // Use fallback tracking for now
      this.initializeFallbackTracking()
    }
  }

  private initializeFallbackTracking() {
    // Fallback performance tracking without web-vitals library
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Track Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          if (lastEntry) {
            this.recordMetric('LCP', lastEntry.startTime)
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // Track First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            const e = entry as PerformanceEventTiming
            this.recordMetric('FID', (e.processingStart || 0) - (e.startTime || 0))
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })

        // Track Cumulative Layout Shift
        let clsValue = 0
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            const e = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean }
            if (!e.hadRecentInput) {
              clsValue += e.value || 0
            }
          })
          this.recordMetric('CLS', clsValue)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })

      } catch (error) {
        logger.warn('Performance tracking not supported', { error: error instanceof Error ? { name: error.name, message: error.message } : undefined })
      }
    }
  }

  private handleMetric(metricName: string, metric: { value: number }) {
    this.recordMetric(metricName, metric.value)
  }

  private recordMetric(name: string, value: number) {
    if (!this.isEnabled) return

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType()
    }

    this.metrics.set(name, metric)

    // Check if metric exceeds thresholds and report
    this.checkThresholds(metric)

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`📊 Performance Metric: ${name} = ${value.toFixed(2)}ms`)
    }
  }

  private getConnectionType(): string {
    const nav = navigator as Navigator & { connection?: { effectiveType?: string } }
    return nav.connection?.effectiveType || 'unknown'
  }

  private checkThresholds(metric: PerformanceMetric) {
    const { name, value } = metric
    let status: 'good' | 'needs-improvement' | 'poor' = 'good'
    let threshold = 0

    switch (name) {
      case 'LCP':
        if (value > PERFORMANCE_THRESHOLDS.LCP_NEEDS_IMPROVEMENT) {
          status = 'poor'
          threshold = PERFORMANCE_THRESHOLDS.LCP_NEEDS_IMPROVEMENT
        } else if (value > PERFORMANCE_THRESHOLDS.LCP_GOOD) {
          status = 'needs-improvement'
          threshold = PERFORMANCE_THRESHOLDS.LCP_GOOD
        }
        break
      
      case 'FID':
        if (value > PERFORMANCE_THRESHOLDS.FID_NEEDS_IMPROVEMENT) {
          status = 'poor'
          threshold = PERFORMANCE_THRESHOLDS.FID_NEEDS_IMPROVEMENT
        } else if (value > PERFORMANCE_THRESHOLDS.FID_GOOD) {
          status = 'needs-improvement'
          threshold = PERFORMANCE_THRESHOLDS.FID_GOOD
        }
        break
      
      case 'CLS':
        if (value > PERFORMANCE_THRESHOLDS.CLS_NEEDS_IMPROVEMENT) {
          status = 'poor'
          threshold = PERFORMANCE_THRESHOLDS.CLS_NEEDS_IMPROVEMENT
        } else if (value > PERFORMANCE_THRESHOLDS.CLS_GOOD) {
          status = 'needs-improvement'
          threshold = PERFORMANCE_THRESHOLDS.CLS_GOOD
        }
        break
    }

    // Report performance issues to monitoring
    if (status !== 'good') {
      // reportMessage(
      //   `Performance Issue: ${name} (${value.toFixed(2)} > ${threshold})`,
      //   status === 'poor' ? 'error' : 'warning'
      // )
      logger.warn(`Performance Issue: ${name} (${value.toFixed(2)} > ${threshold})`)
    }
  }

  // Public methods
  public getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values())
  }

  public getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name)
  }

  public recordCustomMetric(name: string, value: number) {
    this.recordMetric(name, value)
  }
}

// API Performance tracking
export class APIPerformanceTracker {
  private static instance: APIPerformanceTracker
  private requests: Map<string, number> = new Map()

  static getInstance(): APIPerformanceTracker {
    if (!this.instance) {
      this.instance = new APIPerformanceTracker()
    }
    return this.instance
  }

  public startRequest(url: string): string {
    const requestId = `${url}_${Date.now()}_${Math.random()}`
    this.requests.set(requestId, performance.now())
    return requestId
  }

  public endRequest(requestId: string, url: string, success: boolean = true) {
    const startTime = this.requests.get(requestId)
    if (!startTime) return

    const duration = performance.now() - startTime
    this.requests.delete(requestId)

    // Record API performance metric
    if (typeof window !== 'undefined' && (globalThis as unknown as { webVitalsTracker?: { recordCustomMetric: (n: string, v: number) => void } }).webVitalsTracker) {
      ;(globalThis as unknown as { webVitalsTracker?: { recordCustomMetric: (n: string, v: number) => void } }).webVitalsTracker!.recordCustomMetric(`API_${url}`, duration)
    }

    // Check API response time threshold
    if (duration > PERFORMANCE_THRESHOLDS.API_RESPONSE) {
      // reportMessage(
      //   `Slow API Response: ${url} took ${duration.toFixed(2)}ms`,
      //   'warning'
      // )
      logger.warn(`Slow API Response: ${url} took ${duration.toFixed(2)}ms`)
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`🌐 API ${success ? '✅' : '❌'}: ${url} - ${duration.toFixed(2)}ms`)
    }
  }
}

// Booking flow performance tracking
export class BookingFlowTracker {
  private static instance: BookingFlowTracker
  private flowStart: number | null = null
  private stepTimestamps: Map<string, number> = new Map()

  static getInstance(): BookingFlowTracker {
    if (!this.instance) {
      this.instance = new BookingFlowTracker()
    }
    return this.instance
  }

  public startFlow() {
    this.flowStart = performance.now()
    this.stepTimestamps.clear()
    this.recordStep('flow_start')
  }

  public recordStep(stepName: string) {
    if (!this.flowStart) return
    
    const timestamp = performance.now()
    const elapsed = timestamp - this.flowStart
    
    this.stepTimestamps.set(stepName, elapsed)

    // Log step timing in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`🎯 Booking Step: ${stepName} at ${elapsed.toFixed(2)}ms`)
    }
  }

  public completeFlow(success: boolean = true) {
    if (!this.flowStart) return

    const totalTime = performance.now() - this.flowStart
    
    // Record total booking flow time
    if (typeof window !== 'undefined' && (globalThis as unknown as { webVitalsTracker?: { recordCustomMetric: (n: string, v: number) => void } }).webVitalsTracker) {
      ;(globalThis as unknown as { webVitalsTracker?: { recordCustomMetric: (n: string, v: number) => void } }).webVitalsTracker!.recordCustomMetric('BOOKING_FLOW_TOTAL', totalTime)
    }

    // Check booking flow threshold
    if (totalTime > PERFORMANCE_THRESHOLDS.BOOKING_FLOW) {
      // reportMessage(
      //   `Long Booking Flow: ${totalTime.toFixed(2)}ms (${success ? 'success' : 'abandoned'})`,
      //   'warning'
      // )
      logger.warn(`Long Booking Flow: ${totalTime.toFixed(2)}ms (${success ? 'success' : 'abandoned'})`)
    }

    // Report step-by-step analysis
    const steps = Array.from(this.stepTimestamps.entries())
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.group(`📊 Booking Flow Analysis (${totalTime.toFixed(2)}ms total)`)
      steps.forEach(([step, time], index) => {
        const previousTime = index > 0 ? (steps[index - 1]?.[1] || 0) : 0
        const stepDuration = time - previousTime
        logger.debug(`  ${step}: ${stepDuration.toFixed(2)}ms (at ${time.toFixed(2)}ms)`)
      })
      // eslint-disable-next-line no-console
      console.groupEnd()
    }

    // Reset
    this.flowStart = null
    this.stepTimestamps.clear()
  }
}

// Initialize global performance tracking
export function initializePerformanceTracking() {
  if (typeof window === 'undefined') return

  // Initialize Web Vitals tracker
  const webVitalsTracker = new WebVitalsTracker()
  ;(globalThis as unknown as { webVitalsTracker?: unknown }).webVitalsTracker = webVitalsTracker as unknown as never

  // Initialize API tracker
  const apiTracker = APIPerformanceTracker.getInstance()
  ;(globalThis as unknown as { apiTracker?: unknown }).apiTracker = apiTracker as unknown as never

  // Initialize booking flow tracker
  const bookingTracker = BookingFlowTracker.getInstance()
  ;(globalThis as unknown as { bookingTracker?: unknown }).bookingTracker = bookingTracker as unknown as never

  // Track page load performance
  window.addEventListener('load', () => {
    setTimeout(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart
        webVitalsTracker.recordCustomMetric('PAGE_LOAD', loadTime)
        
        if (process.env.NODE_ENV === 'development') {
          logger.debug(`📄 Page Load: ${loadTime.toFixed(2)}ms`)
        }
      }
    }, 0)
  })

  logger.debug('📊 Performance tracking initialized')
}

// Export singleton instances
export const webVitalsTracker = typeof window !== 'undefined' ? new WebVitalsTracker() : null
export const apiTracker = APIPerformanceTracker.getInstance()
export const bookingTracker = BookingFlowTracker.getInstance()