/**
 * GDPR Consent Manager for Love4Detailing
 * 
 * Handles user consent for analytics and tracking cookies
 * in compliance with UK GDPR and Privacy laws.
 */

import { analytics } from './google-analytics'
import { logger } from '@/lib/utils/logger'

// Consent storage key
const CONSENT_STORAGE_KEY = 'love4detailing_analytics_consent'
const CONSENT_VERSION = '1.0'

// Consent types
export interface ConsentPreferences {
  analytics: boolean
  functional: boolean
  version: string
  timestamp: number
}

// Default consent (minimal necessary cookies only)
const DEFAULT_CONSENT: ConsentPreferences = {
  analytics: false,
  functional: true, // Required for website functionality
  version: CONSENT_VERSION,
  timestamp: Date.now(),
}

/**
 * Consent Manager Class
 */
export class ConsentManager {
  private consent: ConsentPreferences | null = null
  private hasShownBanner: boolean = false
  private listeners: Array<(consent: ConsentPreferences) => void> = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadConsent()
      this.applyConsent()
    }
  }

  /**
   * Load consent from localStorage
   */
  private loadConsent() {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as ConsentPreferences
        
        // Check if consent is still valid (same version, not expired)
        const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000)
        
        if (parsed.version === CONSENT_VERSION && parsed.timestamp > sixMonthsAgo) {
          this.consent = parsed
          this.hasShownBanner = true
        }
      }
    } catch (error) {
      logger.warn('Failed to load consent preferences', error instanceof Error ? error : undefined)
    }

    // Use default if no valid consent found
    if (!this.consent) {
      this.consent = { ...DEFAULT_CONSENT }
    }
  }

  /**
   * Save consent to localStorage
   */
  private saveConsent() {
    if (!this.consent) return

    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(this.consent))
    } catch (error) {
      logger.warn('Failed to save consent preferences', error instanceof Error ? error : undefined)
    }
  }

  /**
   * Apply consent settings to services
   */
  private applyConsent() {
    if (!this.consent) return

    // Apply to Google Analytics
    if (analytics) {
      analytics.setConsent(this.consent.analytics)
    }

    // Apply to other tracking services as needed
    this.notifyListeners()

    if (process.env.NODE_ENV === 'development') {
      logger.debug('🍪 Consent applied:', this.consent)
    }
  }

  /**
   * Get current consent preferences
   */
  public getConsent(): ConsentPreferences | null {
    return this.consent
  }

  /**
   * Check if consent banner should be shown
   */
  public shouldShowBanner(): boolean {
    return !this.hasShownBanner
  }

  /**
   * Update consent preferences
   */
  public updateConsent(preferences: Partial<Pick<ConsentPreferences, 'analytics' | 'functional'>>) {
    if (!this.consent) {
      this.consent = { ...DEFAULT_CONSENT }
    }

    this.consent = {
      ...this.consent,
      ...preferences,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    }

    this.hasShownBanner = true
    this.saveConsent()
    this.applyConsent()
  }

  /**
   * Accept all optional cookies
   */
  public acceptAll() {
    this.updateConsent({
      analytics: true,
      functional: true,
    })
  }

  /**
   * Accept only essential cookies
   */
  public acceptEssential() {
    this.updateConsent({
      analytics: false,
      functional: true,
    })
  }

  /**
   * Reject all optional cookies
   */
  public rejectAll() {
    this.updateConsent({
      analytics: false,
      functional: true, // Can't reject functional cookies
    })
  }

  /**
   * Revoke consent (reset to defaults)
   */
  public revokeConsent() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CONSENT_STORAGE_KEY)
    }
    
    this.consent = { ...DEFAULT_CONSENT }
    this.hasShownBanner = false
    this.applyConsent()
  }

  /**
   * Check if specific consent type is granted
   */
  public hasConsent(type: 'analytics' | 'functional'): boolean {
    return this.consent?.[type] ?? DEFAULT_CONSENT[type]
  }

  /**
   * Add listener for consent changes
   */
  public addListener(listener: (consent: ConsentPreferences) => void) {
    this.listeners.push(listener)
    
    // Call immediately with current consent
    if (this.consent) {
      listener(this.consent)
    }
  }

  /**
   * Remove listener
   */
  public removeListener(listener: (consent: ConsentPreferences) => void) {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  /**
   * Notify all listeners of consent changes
   */
  private notifyListeners() {
    if (!this.consent) return

    this.listeners.forEach(listener => {
      try {
        listener(this.consent!)
      } catch (error) {
        logger.error('Consent listener error:', error instanceof Error ? error : undefined)
      }
    })
  }

  /**
   * Get consent summary for privacy policy
   */
  public getConsentSummary(): {
    analytics: { granted: boolean; purpose: string }
    functional: { granted: boolean; purpose: string }
  } {
    return {
      analytics: {
        granted: this.hasConsent('analytics'),
        purpose: 'Website analytics and performance monitoring via Google Analytics 4'
      },
      functional: {
        granted: this.hasConsent('functional'),
        purpose: 'Essential website functionality, user preferences, and session management'
      }
    }
  }
}

// Global consent manager instance
export const consentManager = typeof window !== 'undefined' ? new ConsentManager() : null

// Hooks for React components
export function useConsent() {
  if (typeof window === 'undefined') {
    return {
      consent: null,
      hasConsent: () => false,
      shouldShowBanner: () => false,
      acceptAll: () => {},
      acceptEssential: () => {},
      rejectAll: () => {},
      updateConsent: () => {},
      revokeConsent: () => {},
    }
  }

  return {
    consent: consentManager?.getConsent() || null,
    hasConsent: (type: 'analytics' | 'functional') => consentManager?.hasConsent(type) ?? false,
    shouldShowBanner: () => consentManager?.shouldShowBanner() ?? true,
    acceptAll: () => consentManager?.acceptAll(),
    acceptEssential: () => consentManager?.acceptEssential(),
    rejectAll: () => consentManager?.rejectAll(),
    updateConsent: (preferences: Partial<Pick<ConsentPreferences, 'analytics' | 'functional'>>) => 
      consentManager?.updateConsent(preferences),
    revokeConsent: () => consentManager?.revokeConsent(),
  }
}