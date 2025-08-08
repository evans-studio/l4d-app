/**
 * Cookie Consent Banner Component for Love4Detailing
 * 
 * GDPR-compliant cookie consent banner with detailed preferences
 * and clear information about data usage.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { Text, Heading } from '@/components/ui/primitives/Typography'
import { 
  Cookie, 
  Settings, 
  Shield, 
  BarChart3, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useConsent, ConsentPreferences } from '@/lib/analytics/consent-manager'
import { cn } from '@/lib/utils'

interface CookieConsentBannerProps {
  className?: string
}

export function CookieConsentBanner({ className }: CookieConsentBannerProps) {
  const {
    shouldShowBanner,
    acceptAll,
    acceptEssential,
    updateConsent,
  } = useConsent()

  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [preferences, setPreferences] = useState<Partial<Pick<ConsentPreferences, 'analytics' | 'functional'>>>({
    analytics: false,
    functional: true,
  })

  useEffect(() => {
    // Show banner after a brief delay to avoid layout flash
    const timer = setTimeout(() => {
      setIsVisible(shouldShowBanner())
    }, 1000)

    return () => clearTimeout(timer)
  }, [shouldShowBanner])

  const handleAcceptAll = () => {
    acceptAll()
    setIsVisible(false)
  }

  const handleAcceptEssential = () => {
    acceptEssential()
    setIsVisible(false)
  }

  const handleSavePreferences = () => {
    updateConsent(preferences)
    setIsVisible(false)
  }

  const handlePreferenceChange = (type: 'analytics' | 'functional', value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [type]: value
    }))
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      "fixed inset-x-0 bottom-0 z-50 p-4",
      "bg-black/80 backdrop-blur-sm",
      "animate-in slide-in-from-bottom duration-300",
      className
    )}>
      <Card className="max-w-4xl mx-auto border-gray-700 bg-gray-800/95 backdrop-blur">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2 bg-blue-900/20 rounded-lg">
              <Cookie className="w-6 h-6 text-blue-400" />
            </div>
            
            <div className="flex-1">
              <Heading size="h3" color="white" className="mb-2">
                We value your privacy
              </Heading>
              <Text size="base" color="secondary" className="leading-relaxed">
                We use cookies and similar technologies to provide the best experience on our website. 
                Some are essential for functionality, while others help us understand how you use our 
                site and improve our services.
              </Text>
            </div>
          </div>

          {/* Quick Actions */}
          {!showDetails && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAcceptAll}
                variant="primary"
                size="md"
                className="bg-brand-600 hover:bg-brand-700"
              >
                Accept All
              </Button>
              
              <Button
                onClick={handleAcceptEssential}
                variant="outline"
                size="md"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Essential Only
              </Button>
              
              <Button
                onClick={() => setShowDetails(true)}
                variant="ghost"
                size="md"
                leftIcon={<Settings className="w-4 h-4" />}
                className="text-gray-400 hover:text-gray-300"
              >
                Customize
              </Button>
            </div>
          )}

          {/* Detailed Preferences */}
          {showDetails && (
            <div className="space-y-6">
              {/* Cookie Categories */}
              <div className="space-y-4">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-start gap-3 flex-1">
                    <Shield className="w-5 h-5 text-green-400 mt-1" />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Text size="sm" weight="semibold" color="white">
                          Essential Cookies
                        </Text>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <Text size="xs" color="secondary" className="leading-relaxed">
                        Required for website functionality, security, and your preferences. 
                        Cannot be disabled.
                      </Text>
                    </div>
                  </div>
                  <div className="text-green-400 text-sm font-medium">
                    Always On
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-700/30 rounded-lg">
                  <div className="flex items-start gap-3 flex-1">
                    <BarChart3 className="w-5 h-5 text-blue-400 mt-1" />
                    <div>
                      <Text size="sm" weight="semibold" color="white" className="mb-1">
                        Analytics Cookies
                      </Text>
                      <Text size="xs" color="secondary" className="leading-relaxed">
                        Help us understand website usage, measure performance, and improve 
                        our services. Uses Google Analytics 4 with privacy protections.
                      </Text>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('analytics', !preferences.analytics)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      preferences.analytics 
                        ? "bg-green-900/20 text-green-400 hover:bg-green-900/30"
                        : "bg-red-900/20 text-red-400 hover:bg-red-900/30"
                    )}
                  >
                    {preferences.analytics ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Disabled
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Privacy Information */}
              <div className="bg-gray-700/20 rounded-lg p-4">
                <Text size="xs" color="secondary" className="leading-relaxed">
                  <strong>Your data is protected:</strong> We use privacy-first analytics, 
                  anonymize IP addresses, and do not sell your data to third parties. 
                  You can change these preferences at any time in our{' '}
                  <a 
                    href="/privacy-policy" 
                    className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                  >
                    Privacy Policy
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </Text>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSavePreferences}
                  variant="primary"
                  size="md"
                  className="bg-brand-600 hover:bg-brand-700"
                >
                  Save Preferences
                </Button>
                
                <Button
                  onClick={handleAcceptAll}
                  variant="outline"
                  size="md"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Accept All
                </Button>
                
                <Button
                  onClick={() => setShowDetails(false)}
                  variant="ghost"
                  size="md"
                  leftIcon={<ChevronUp className="w-4 h-4" />}
                  className="text-gray-400 hover:text-gray-300"
                >
                  Show Less
                </Button>
              </div>
            </div>
          )}

          {/* Footer Links */}
          <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-gray-700">
            <a
              href="/privacy-policy"
              className="text-xs text-gray-400 hover:text-gray-300 inline-flex items-center gap-1"
            >
              Privacy Policy
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="/terms-of-service"
              className="text-xs text-gray-400 hover:text-gray-300 inline-flex items-center gap-1"
            >
              Terms of Service
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Preferences Manager Component (for settings page)
 */
export function CookiePreferences() {
  const { consent, updateConsent, revokeConsent } = useConsent()
  const [preferences, setPreferences] = useState<Partial<Pick<ConsentPreferences, 'analytics' | 'functional'>>>({
    analytics: consent?.analytics ?? false,
    functional: consent?.functional ?? true,
  })

  useEffect(() => {
    if (consent) {
      setPreferences({
        analytics: consent.analytics,
        functional: consent.functional,
      })
    }
  }, [consent])

  const handleSave = () => {
    updateConsent(preferences)
  }

  const handleReset = () => {
    revokeConsent()
    setPreferences({
      analytics: false,
      functional: true,
    })
  }

  const handlePreferenceChange = (type: 'analytics' | 'functional', value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [type]: value
    }))
  }

  return (
    <Card className="border-gray-700 bg-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Cookie className="w-6 h-6 text-blue-400" />
          <Heading size="h3" color="white">
            Cookie Preferences
          </Heading>
        </div>

        <div className="space-y-4 mb-6">
          {/* Essential Cookies */}
          <div className="flex items-start justify-between p-4 bg-gray-700/30 rounded-lg">
            <div className="flex items-start gap-3 flex-1">
              <Shield className="w-5 h-5 text-green-400 mt-1" />
              <div>
                <Text size="sm" weight="semibold" color="white" className="mb-1">
                  Essential Cookies
                </Text>
                <Text size="xs" color="secondary">
                  Required for website functionality and security.
                </Text>
              </div>
            </div>
            <div className="text-green-400 text-sm font-medium">
              Always On
            </div>
          </div>

          {/* Analytics Cookies */}
          <div className="flex items-start justify-between p-4 bg-gray-700/30 rounded-lg">
            <div className="flex items-start gap-3 flex-1">
              <BarChart3 className="w-5 h-5 text-blue-400 mt-1" />
              <div>
                <Text size="sm" weight="semibold" color="white" className="mb-1">
                  Analytics Cookies
                </Text>
                <Text size="xs" color="secondary">
                  Website usage analytics and performance monitoring.
                </Text>
              </div>
            </div>
            <button
              onClick={() => handlePreferenceChange('analytics', !preferences.analytics)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                preferences.analytics 
                  ? "bg-green-900/20 text-green-400 hover:bg-green-900/30"
                  : "bg-red-900/20 text-red-400 hover:bg-red-900/30"
              )}
            >
              {preferences.analytics ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Enabled
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  Disabled
                </>
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            variant="primary"
            size="md"
          >
            Save Changes
          </Button>
          
          <Button
            onClick={handleReset}
            variant="outline"
            size="md"
          >
            Reset to Defaults
          </Button>
        </div>

        {consent && (
          <Text size="xs" color="muted" className="mt-4">
            Last updated: {new Date(consent.timestamp).toLocaleDateString()}
          </Text>
        )}
      </CardContent>
    </Card>
  )
}