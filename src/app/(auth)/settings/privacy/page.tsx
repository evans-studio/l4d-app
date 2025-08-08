/**
 * Privacy Settings Page for Love4Detailing
 * 
 * Allows users to manage their privacy preferences and cookie consent.
 * GDPR-compliant privacy controls with detailed explanations.
 */

import { Metadata } from 'next'
import { Card, CardContent, CardHeader } from '@/components/ui/composites/Card'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { CookiePreferences } from '@/components/ui/patterns/CookieConsentBanner'
import { Shield, Eye, Database, Cookie, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Settings',
  description: 'Manage your privacy preferences and cookie consent for Love4Detailing.',
}

export default function PrivacySettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Heading size="h1" color="white" className="mb-4">
            Privacy Settings
          </Heading>
          <Text size="lg" color="secondary" className="leading-relaxed">
            Control how your data is collected and used. We respect your privacy
            and give you full control over your personal information.
          </Text>
        </div>

        <div className="grid gap-6">
          {/* Cookie Preferences */}
          <CookiePreferences />

          {/* Privacy Information */}
          <Card className="border-gray-700 bg-gray-800">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-green-400" />
                <Heading size="h3" color="white">
                  Your Privacy Rights
                </Heading>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Data We Collect */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-blue-400" />
                    <Heading size="h4" color="white">
                      Data We Collect
                    </Heading>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="bg-gray-700/30 p-3 rounded-lg">
                      <Text size="sm" weight="semibold" color="white" className="mb-1">
                        Essential Data
                      </Text>
                      <Text size="xs" color="secondary">
                        Account information, booking details, service preferences, and communication history.
                      </Text>
                    </div>
                    <div className="bg-gray-700/30 p-3 rounded-lg">
                      <Text size="sm" weight="semibold" color="white" className="mb-1">
                        Analytics Data (Optional)
                      </Text>
                      <Text size="xs" color="secondary">
                        Anonymized usage patterns, performance metrics, and general location data.
                      </Text>
                    </div>
                  </div>
                </div>

                {/* How We Use Data */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-purple-400" />
                    <Heading size="h4" color="white">
                      How We Use Data
                    </Heading>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="bg-gray-700/30 p-3 rounded-lg">
                      <Text size="sm" weight="semibold" color="white" className="mb-1">
                        Service Delivery
                      </Text>
                      <Text size="xs" color="secondary">
                        Process bookings, communicate updates, and provide customer support.
                      </Text>
                    </div>
                    <div className="bg-gray-700/30 p-3 rounded-lg">
                      <Text size="sm" weight="semibold" color="white" className="mb-1">
                        Service Improvement
                      </Text>
                      <Text size="xs" color="secondary">
                        Analyze usage patterns to improve website performance and user experience.
                      </Text>
                    </div>
                  </div>
                </div>
              </div>

              {/* Your Rights */}
              <div className="border-t border-gray-700 pt-6">
                <Heading size="h4" color="white" className="mb-4">
                  Your Rights Under UK GDPR
                </Heading>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Text size="sm" weight="semibold" color="white">
                      Right to Access
                    </Text>
                    <Text size="xs" color="secondary">
                      Request a copy of all personal data we hold about you.
                    </Text>
                  </div>
                  <div className="space-y-2">
                    <Text size="sm" weight="semibold" color="white">
                      Right to Rectification
                    </Text>
                    <Text size="xs" color="secondary">
                      Request correction of inaccurate personal data.
                    </Text>
                  </div>
                  <div className="space-y-2">
                    <Text size="sm" weight="semibold" color="white">
                      Right to Erasure
                    </Text>
                    <Text size="xs" color="secondary">
                      Request deletion of your personal data ("right to be forgotten").
                    </Text>
                  </div>
                  <div className="space-y-2">
                    <Text size="sm" weight="semibold" color="white">
                      Right to Portability
                    </Text>
                    <Text size="xs" color="secondary">
                      Request your data in a structured, machine-readable format.
                    </Text>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="border-gray-700 bg-gray-800">
            <CardContent className="p-6">
              <Heading size="h4" color="white" className="mb-4">
                Exercise Your Rights
              </Heading>
              <Text size="sm" color="secondary" className="mb-4 leading-relaxed">
                To exercise any of your privacy rights or ask questions about our data practices, 
                please contact our Data Protection Officer:
              </Text>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Text size="sm" color="white">
                    📧 Email: zell@love4detailing.com
                  </Text>
                </div>
                <div className="flex items-center gap-3">
                  <Text size="sm" color="white">
                    📞 Phone: +44 7908 625581
                  </Text>
                </div>
                <div className="flex items-center gap-3">
                  <Text size="sm" color="white">
                    📮 Post: Love 4 Detailing, Privacy Requests, United Kingdom
                  </Text>
                </div>
              </div>
              <Text size="xs" color="muted" className="mt-4">
                We will respond to your request within 30 days as required by UK GDPR.
              </Text>
            </CardContent>
          </Card>

          {/* Legal Links */}
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/privacy-policy"
              className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              Full Privacy Policy
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="/terms-of-service"
              className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              Terms of Service
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}