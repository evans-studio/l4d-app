/**
 * Booking Analytics Hook for Love4Detailing
 * 
 * Provides easy-to-use analytics tracking for the booking flow
 * with automatic event tracking and performance monitoring.
 */

'use client'

import { useEffect, useRef, useCallback } from 'react'
import { analytics, bookingAnalytics } from '@/lib/analytics/google-analytics'
import { useConsent } from '@/lib/analytics/consent-manager'
import type { BookingEventParams } from '@/lib/analytics/google-analytics'

export interface UseBookingAnalyticsOptions {
  autoTrackPageViews?: boolean
  trackPerformance?: boolean
  trackErrors?: boolean
}

export interface BookingStepData {
  stepName: string
  serviceType?: string
  vehicleType?: string
  location?: string
  price?: number
  validationErrors?: string[]
  timeSpent?: number
}

export function useBookingAnalytics(options: UseBookingAnalyticsOptions = {}) {
  const { hasConsent } = useConsent()
  const {
    autoTrackPageViews = true,
    trackPerformance = true,
    trackErrors = true,
  } = options

  const stepStartTime = useRef<number | null>(null)
  const currentStep = useRef<string | null>(null)

  // Track page views automatically
  useEffect(() => {
    if (autoTrackPageViews && hasConsent('analytics') && analytics) {
      analytics.trackPageView()
    }
  }, [autoTrackPageViews, hasConsent])

  // Track performance metrics
  useEffect(() => {
    if (trackPerformance && hasConsent('analytics')) {
      // Track page load performance
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            analytics?.trackPerformance({
              metric_name: 'page_load_time',
              metric_value: navEntry.loadEventEnd - navEntry.fetchStart,
              page_path: window.location.pathname,
            })
          }
        })
      })

      observer.observe({ entryTypes: ['navigation'] })

      return () => observer.disconnect()
    }
    return undefined
  }, [trackPerformance, hasConsent])

  // Track errors automatically
  useEffect(() => {
    if (trackErrors && hasConsent('analytics')) {
      const handleError = (event: ErrorEvent) => {
        analytics?.trackError(`${event.message} at ${event.filename}:${event.lineno}`, false)
      }

      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        analytics?.trackError(`Unhandled promise rejection: ${event.reason}`, false)
      }

      window.addEventListener('error', handleError)
      window.addEventListener('unhandledrejection', handleUnhandledRejection)

      return () => {
        window.removeEventListener('error', handleError)
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    }
    return undefined
  }, [trackErrors, hasConsent])

  /**
   * Start tracking the booking flow
   */
  const startBookingFlow = useCallback(() => {
    if (!hasConsent('analytics')) return

    bookingAnalytics?.startFlow()
    stepStartTime.current = Date.now()
    currentStep.current = 'started'

    // Track engagement
    analytics?.trackEngagement('booking_flow', 'started', 'booking_form')
  }, [hasConsent])

  /**
   * Track a booking step
   */
  const trackBookingStep = useCallback((stepData: BookingStepData) => {
    if (!hasConsent('analytics')) return

    const now = Date.now()
    const timeSpent = stepStartTime.current ? now - stepStartTime.current : 0

    // Track the step
    bookingAnalytics?.trackStep(stepData.stepName, {
      service_type: stepData.serviceType,
      vehicle_type: stepData.vehicleType,
      location: stepData.location,
      price: stepData.price,
    })

    // Track validation errors if any
    if (stepData.validationErrors && stepData.validationErrors.length > 0) {
      analytics?.trackEvent('form_validation_error', {
        step: stepData.stepName,
        errors: stepData.validationErrors.join(', '),
        error_count: stepData.validationErrors.length,
      })
    }

    // Track time spent on step
    if (currentStep.current && timeSpent > 0) {
      analytics?.trackEvent('step_timing', {
        previous_step: currentStep.current,
        current_step: stepData.stepName,
        time_spent: timeSpent,
      })
    }

    // Update state
    stepStartTime.current = now
    currentStep.current = stepData.stepName
  }, [hasConsent])

  /**
   * Complete the booking flow
   */
  const completeBooking = useCallback((
    bookingId: string,
    serviceType: string,
    totalPrice: number,
    additionalData?: BookingEventParams
  ) => {
    if (!hasConsent('analytics')) return

    bookingAnalytics?.completeFlow(bookingId, serviceType, totalPrice)

    // Track additional engagement
    analytics?.trackEngagement('booking_flow', 'completed', serviceType, totalPrice)

    // Track conversion value
    analytics?.trackConversion('booking', totalPrice)

    // Track custom event with additional data
    if (additionalData) {
      analytics?.trackEvent('booking_completed_details', {
        booking_id: bookingId,
        ...additionalData,
      })
    }

    // Reset step tracking
    stepStartTime.current = null
    currentStep.current = null
  }, [hasConsent])

  /**
   * Abandon the booking flow
   */
  const abandonBooking = useCallback((reason?: string, currentStepName?: string) => {
    if (!hasConsent('analytics')) return

    bookingAnalytics?.abandonFlow(reason)

    // Track engagement
    analytics?.trackEngagement('booking_flow', 'abandoned', currentStepName || currentStep.current || 'unknown')

    // Track specific abandonment reason
    analytics?.trackEvent('booking_abandonment', {
      step: currentStepName || currentStep.current,
      reason: reason || 'unknown',
      time_in_flow: stepStartTime.current ? Date.now() - stepStartTime.current : 0,
    })

    // Reset step tracking
    stepStartTime.current = null
    currentStep.current = null
  }, [hasConsent])

  /**
   * Track form interaction
   */
  const trackFormInteraction = useCallback((
    action: 'focus' | 'blur' | 'change' | 'submit',
    fieldName: string,
    fieldType?: string,
    value?: any
  ) => {
    if (!hasConsent('analytics')) return

    analytics?.trackEvent('form_interaction', {
      action,
      field_name: fieldName,
      field_type: fieldType,
      step: currentStep.current,
      // Don't track sensitive values
      has_value: value != null && value !== '',
    })
  }, [hasConsent])

  /**
   * Track user engagement events
   */
  const trackEngagement = useCallback((
    action: string,
    category: string,
    label?: string,
    value?: number
  ) => {
    if (!hasConsent('analytics')) return

    analytics?.trackEngagement(action, category, label, value)
  }, [hasConsent])

  /**
   * Track custom event
   */
  const trackEvent = useCallback((
    eventName: string,
    parameters?: Record<string, any>
  ) => {
    if (!hasConsent('analytics')) return

    analytics?.trackEvent(eventName, parameters)
  }, [hasConsent])

  /**
   * Track performance metric
   */
  const trackPerformanceMetric = useCallback((
    metricName: string,
    value: number,
    additionalData?: Record<string, any>
  ) => {
    if (!hasConsent('analytics') || !trackPerformance) return

    analytics?.trackPerformance({
      metric_name: metricName,
      metric_value: value,
      page_path: window.location.pathname,
      ...additionalData,
    })
  }, [hasConsent, trackPerformance])

  /**
   * Track user contact events
   */
  const trackContact = useCallback((
    contactType: 'phone' | 'email' | 'form',
    context?: string
  ) => {
    if (!hasConsent('analytics')) return

    analytics?.trackConversion(contactType === 'phone' ? 'phone_call' : 'email_contact')
    analytics?.trackEngagement('contact', contactType, context)
  }, [hasConsent])

  /**
   * Track page view manually
   */
  const trackPageView = useCallback((path?: string, title?: string) => {
    if (!hasConsent('analytics')) return

    analytics?.trackPageView(path, title)
  }, [hasConsent])

  return {
    // Booking flow tracking
    startBookingFlow,
    trackBookingStep,
    completeBooking,
    abandonBooking,
    
    // Form and interaction tracking
    trackFormInteraction,
    trackEngagement,
    trackEvent,
    
    // Performance tracking
    trackPerformanceMetric,
    
    // Contact and conversion tracking
    trackContact,
    
    // Page tracking
    trackPageView,
    
    // Utility
    hasAnalyticsConsent: hasConsent('analytics'),
    currentStep: currentStep.current,
  }
}

/**
 * Simplified hook for basic page analytics
 */
export function usePageAnalytics(pageName?: string) {
  const { trackPageView, trackEngagement, hasAnalyticsConsent } = useBookingAnalytics({
    autoTrackPageViews: true,
    trackPerformance: true,
    trackErrors: true,
  })

  useEffect(() => {
    if (pageName && hasAnalyticsConsent) {
      trackPageView(undefined, pageName)
    }
  }, [pageName, hasAnalyticsConsent, trackPageView])

  return {
    trackEngagement,
    hasAnalyticsConsent,
  }
}