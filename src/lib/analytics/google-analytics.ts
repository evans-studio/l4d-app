import { logger } from '@/lib/utils/logger'
/**
 * Google Analytics 4 Integration for Love4Detailing
 * 
 * Privacy-compliant GA4 tracking with GDPR consent management
 * and comprehensive event tracking for booking flow analytics.
 */

// GA4 Configuration
export const GA4_CONFIG = {
  measurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || 'G-PLACEHOLDER',
  cookieFlags: 'SameSite=None;Secure', // For cross-site tracking compliance
  trackingOptions: {
    anonymize_ip: true,
    allow_google_signals: false, // Disable for GDPR compliance
    allow_ad_personalization_signals: false,
    cookie_expires: 63072000, // 2 years in seconds
  }
}

// GA4 Event Types
export interface GA4Event {
  event_name: string
  event_parameters?: Record<string, unknown>
}

// Booking-specific event interfaces
export interface BookingEventParams {
  booking_id?: string
  service_type?: string
  vehicle_type?: string
  location?: string
  price?: number
  currency?: string
  booking_step?: string
}

export interface PerformanceEventParams {
  metric_name: string
  metric_value: number
  page_path?: string
  user_agent?: string
}

/**
 * Google Analytics 4 Manager Class
 */
export class GoogleAnalytics {
  private isInitialized: boolean = false
  private hasConsent: boolean = false
  private debugMode: boolean = false

  constructor() {
    this.debugMode = process.env.NODE_ENV === 'development'
    
    if (typeof window !== 'undefined') {
      this.initializeGA4()
    }
  }

  /**
   * Initialize Google Analytics 4
   */
  private async initializeGA4() {
    if (this.isInitialized || !GA4_CONFIG.measurementId || GA4_CONFIG.measurementId === 'G-PLACEHOLDER') {
      if (this.debugMode) {
        logger.debug('📊 GA4: Skipping initialization (no measurement ID or already initialized)')
      }
      return
    }

    try {
      // Load gtag script dynamically
      await this.loadGtagScript()
      
      // Initialize GA4
      if (typeof window.gtag !== 'undefined') {
        window.gtag('js', new Date())
        window.gtag('config', GA4_CONFIG.measurementId, {
          ...GA4_CONFIG.trackingOptions,
          send_page_view: false, // We'll handle page views manually
        })
        
        this.isInitialized = true
        
        if (this.debugMode) {
          logger.debug('📊 GA4: Initialized successfully', { measurementId: GA4_CONFIG.measurementId })
        }
      }
    } catch (error) {
      logger.error('📊 GA4: Initialization failed:', error instanceof Error ? error : undefined)
    }
  }

  /**
   * Load Google Analytics gtag script
   */
  private loadGtagScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if gtag is already loaded
      if (typeof window.gtag !== 'undefined') {
        resolve()
        return
      }

      // Create and inject script
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_CONFIG.measurementId}`
      script.onload = () => {
        // Initialize gtag function
        window.dataLayer = window.dataLayer || []
        window.gtag = function() {
          window.dataLayer.push(arguments)
        }
        resolve()
      }
      script.onerror = reject
      
      document.head.appendChild(script)
    })
  }

  /**
   * Set user consent for GDPR compliance
   */
  public setConsent(hasConsent: boolean) {
    this.hasConsent = hasConsent
    
    if (!this.isInitialized) return

    if (typeof window.gtag !== 'undefined') {
      window.gtag('consent', 'update', {
        analytics_storage: hasConsent ? 'granted' : 'denied',
        ad_storage: 'denied', // Always deny ads for privacy
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      })
    }

    if (this.debugMode) {
      logger.debug(`📊 GA4: Consent ${hasConsent ? 'granted' : 'denied'}`)
    }
  }

  /**
   * Track page view
   */
  public trackPageView(path?: string, title?: string) {
    if (!this.canTrack()) return

    const pageData = {
      page_title: title || document.title,
      page_location: window.location.href,
      page_path: path || window.location.pathname,
    }

    window.gtag('event', 'page_view', pageData)

    if (this.debugMode) {
      logger.debug('📊 GA4: Page View', pageData)
    }
  }

  /**
   * Track custom event
   */
  public trackEvent(eventName: string, parameters: Record<string, unknown> = {}) {
    if (!this.canTrack()) return

    // Sanitize parameters (remove sensitive data)
    const sanitizedParams = this.sanitizeParameters(parameters)

    window.gtag('event', eventName, sanitizedParams)

    if (this.debugMode) {
      logger.debug(`📊 GA4: Event - ${eventName}`, sanitizedParams)
    }
  }

  /**
   * Track booking events
   */
  public trackBookingEvent(eventType: 'booking_started' | 'booking_step' | 'booking_completed' | 'booking_cancelled', params: BookingEventParams = {}) {
    const eventData = {
      ...params,
      timestamp: Date.now(),
      user_agent: navigator.userAgent.substring(0, 100), // Truncate for privacy
    }

    // Add currency default
    if (params.price && !params.currency) {
      eventData.currency = 'GBP'
    }

    this.trackEvent(eventType, eventData)
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(params: PerformanceEventParams) {
    this.trackEvent('performance_metric', {
      custom_metric_name: params.metric_name,
      custom_metric_value: params.metric_value,
      page_path: params.page_path || window.location.pathname,
      measurement_unit: 'milliseconds',
    })
  }

  /**
   * Track user engagement
   */
  public trackEngagement(action: string, category: string, label?: string, value?: number) {
    this.trackEvent('engagement', {
      engagement_action: action,
      engagement_category: category,
      engagement_label: label,
      engagement_value: value,
    })
  }

  /**
   * Track conversion events
   */
  public trackConversion(conversionType: 'lead' | 'booking' | 'phone_call' | 'email_contact', value?: number) {
    this.trackEvent('conversion', {
      conversion_type: conversionType,
      conversion_value: value,
      currency: value ? 'GBP' : undefined,
    })
  }

  /**
   * Track errors for debugging
   */
  public trackError(error: string, fatal: boolean = false) {
    this.trackEvent('exception', {
      description: error.substring(0, 150), // Limit length
      fatal,
    })
  }

  /**
   * Enhanced ecommerce tracking for booking flow
   */
  public trackPurchase(bookingId: string, items: Array<{
    item_id: string
    item_name: string
    item_category: string
    price: number
    quantity: number
  }>, totalValue: number) {
    if (!this.canTrack()) return

    window.gtag('event', 'purchase', {
      transaction_id: bookingId,
      value: totalValue,
      currency: 'GBP',
      items: items,
    })

    if (this.debugMode) {
      logger.debug('📊 GA4: Purchase', { bookingId, totalValue, items })
    }
  }

  /**
   * Check if tracking is allowed
   */
  private canTrack(): boolean {
    return this.isInitialized && this.hasConsent && typeof window.gtag !== 'undefined'
  }

  /**
   * Sanitize parameters to remove sensitive data
   */
  private sanitizeParameters(params: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...params }
    
    // Remove or hash sensitive fields
    const sensitiveFields = ['email', 'phone', 'address', 'postcode', 'name']
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        delete sanitized[field]
      }
    }
    
    // Truncate long strings
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string' && value.length > 100) {
        sanitized[key] = value.substring(0, 97) + '...'
      }
    }
    
    return sanitized
  }
}

// Booking Flow Tracking Helper
export class BookingFlowAnalytics {
  private ga: GoogleAnalytics
  private flowStartTime: number | null = null
  private currentStep: string = ''

  constructor(ga: GoogleAnalytics) {
    this.ga = ga
  }

  public startFlow() {
    this.flowStartTime = Date.now()
    this.currentStep = 'started'
    
    this.ga.trackBookingEvent('booking_started', {
      booking_step: 'flow_start',
    })
  }

  public trackStep(stepName: string, stepData?: BookingEventParams) {
    const previousStep = this.currentStep
    this.currentStep = stepName
    
    const elapsed = this.flowStartTime ? Date.now() - this.flowStartTime : 0
    
    this.ga.trackBookingEvent('booking_step', {
      booking_step: stepName,
      ...stepData,
    })
  }

  public completeFlow(bookingId: string, serviceType: string, totalPrice: number) {
    const elapsed = this.flowStartTime ? Date.now() - this.flowStartTime : 0
    
    this.ga.trackBookingEvent('booking_completed', {
      booking_id: bookingId,
      service_type: serviceType,
      price: totalPrice,
      currency: 'GBP',
    })

    // Track as conversion
    this.ga.trackConversion('booking', totalPrice)

    // Track as purchase for ecommerce
    this.ga.trackPurchase(bookingId, [{
      item_id: bookingId,
      item_name: serviceType,
      item_category: 'Detailing Service',
      price: totalPrice,
      quantity: 1,
    }], totalPrice)

    // Reset flow
    this.flowStartTime = null
    this.currentStep = ''
  }

  public abandonFlow(reason?: string) {
    const elapsed = this.flowStartTime ? Date.now() - this.flowStartTime : 0
    
    this.ga.trackBookingEvent('booking_cancelled', {
      booking_step: this.currentStep,
    })

    // Reset flow
    this.flowStartTime = null
    this.currentStep = ''
  }
}

// Global Analytics Instance
export const analytics = typeof window !== 'undefined' ? new GoogleAnalytics() : null
export const bookingAnalytics = analytics ? new BookingFlowAnalytics(analytics) : null

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}