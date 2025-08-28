/**
 * Privacy Policy Page
 * 
 * UK GDPR compliant privacy policy for Love4Detailing.
 * Covers data collection, processing, storage, and user rights.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section } from '@/components/layout/templates/PageLayout'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { MainLayout } from '@/components/layouts/MainLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy | Love 4 Detailing',
  description: 'Privacy policy and data protection information for Love 4 Detailing mobile car detailing services.',
  robots: 'index, follow'
}

export default function PrivacyPolicyPage() {
  const lastUpdated = '8th August 2024'

  return (
    <MainLayout>
      <Section padding="xl" background="transparent">
        <Container className="max-w-4xl">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <Heading size="h1" color="white" className="mb-4">
                Privacy Policy
              </Heading>
              <Text size="lg" color="secondary">
                Last updated: {lastUpdated}
              </Text>
            </div>

            {/* Introduction */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                1. Introduction
              </Heading>
              <div className="space-y-3 text-gray-300">
                <Text>
                  Love 4 Detailing ("we," "our," or "us") is committed to protecting and respecting your privacy. 
                  This Privacy Policy explains how we collect, use, and protect your personal information when you 
                  use our mobile car detailing services and website.
                </Text>
                <Text>
                  This policy complies with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
                </Text>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <Text weight="semibold" className="mb-2">Contact Information:</Text>
                  <Text size="sm">
                    Love 4 Detailing<br />
                    Email: {process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'zell@love4detailing.com'}<br />
                    Phone: +44 7908 625581<br />
                    Service Area: South London, United Kingdom
                  </Text>
                </div>
              </div>
            </div>

            {/* Data We Collect */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                2. Information We Collect
              </Heading>
              <div className="space-y-4 text-gray-300">
                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    2.1 Information You Provide
                  </Heading>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Personal details: Name, email address, phone number</li>
                    <li>Service address and location information</li>
                    <li>Vehicle information: Make, model, size, registration (if provided)</li>
                    <li>Booking preferences and special requirements</li>
                    <li>Payment information (processed securely through PayPal)</li>
                    <li>Communication records and service feedback</li>
                  </ul>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    2.2 Information We Automatically Collect
                  </Heading>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Website usage data and analytics (via Google Analytics)</li>
                    <li>IP address and general location information</li>
                    <li>Device information: Browser type, operating system</li>
                    <li>Booking timestamps and service completion records</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Your Data */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                3. How We Use Your Information
              </Heading>
              <div className="space-y-4 text-gray-300">
                <Text>We use your personal information for the following purposes:</Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                    <Heading size="h4" color="white" className="mb-2">Service Delivery</Heading>
                    <ul className="space-y-1 text-sm list-disc list-inside">
                      <li>Processing and managing bookings</li>
                      <li>Scheduling and route optimization</li>
                      <li>Providing mobile car detailing services</li>
                      <li>Service completion notifications</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                    <Heading size="h4" color="white" className="mb-2">Communication</Heading>
                    <ul className="space-y-1 text-sm list-disc list-inside">
                      <li>Booking confirmations and updates</li>
                      <li>Service reminders and notifications</li>
                      <li>Customer support and inquiries</li>
                      <li>Service quality feedback requests</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                    <Heading size="h4" color="white" className="mb-2">Business Operations</Heading>
                    <ul className="space-y-1 text-sm list-disc list-inside">
                      <li>Payment processing and invoicing</li>
                      <li>Service area optimization</li>
                      <li>Business analytics and reporting</li>
                      <li>Fraud prevention and security</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                    <Heading size="h4" color="white" className="mb-2">Legal Compliance</Heading>
                    <ul className="space-y-1 text-sm list-disc list-inside">
                      <li>Tax and accounting requirements</li>
                      <li>Insurance claims processing</li>
                      <li>Regulatory compliance</li>
                      <li>Legal dispute resolution</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Basis */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                4. Legal Basis for Processing
              </Heading>
              <div className="space-y-3 text-gray-300">
                <Text>
                  Under UK GDPR, we process your personal data based on the following legal grounds:
                </Text>
                <div className="space-y-4">
                  <div className="bg-brand-900/20 border border-brand-600/30 rounded-lg p-4">
                    <Text weight="semibold" className="text-brand-400 mb-2">Contract Performance</Text>
                    <Text size="sm">
                      Processing necessary to fulfill our car detailing service contract with you, 
                      including booking management, service delivery, and payment processing.
                    </Text>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                    <Text weight="semibold" className="text-yellow-400 mb-2">Legitimate Interests</Text>
                    <Text size="sm">
                      Business operations, service improvement, fraud prevention, and direct marketing 
                      to existing customers (with opt-out options available).
                    </Text>
                  </div>
                  <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                    <Text weight="semibold" className="text-green-400 mb-2">Consent</Text>
                    <Text size="sm">
                      Marketing communications to non-customers and optional data collection 
                      (you can withdraw consent at any time).
                    </Text>
                  </div>
                  <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                    <Text weight="semibold" className="text-red-400 mb-2">Legal Obligation</Text>
                    <Text size="sm">
                      Compliance with tax, accounting, and other legal requirements.
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Sharing */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                5. Data Sharing and Third Parties
              </Heading>
              <div className="space-y-4 text-gray-300">
                <Text>
                  We do not sell your personal information. We only share your data with trusted third parties 
                  as necessary for service delivery:
                </Text>
                
                <div className="space-y-3">
                  <div className="bg-gray-800/40 border border-gray-600 rounded-lg p-4">
                    <Heading size="h4" color="white" className="mb-2">Essential Service Providers</Heading>
                    <ul className="space-y-1 text-sm list-disc list-inside">
                      <li><strong>PayPal:</strong> Secure payment processing (subject to PayPal's privacy policy)</li>
                      <li><strong>Supabase:</strong> Secure database hosting and user authentication</li>
                      <li><strong>Resend:</strong> Email delivery for booking confirmations and notifications</li>
                      <li><strong>Google Analytics:</strong> Website usage analytics (anonymized data)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-800/40 border border-gray-600 rounded-lg p-4">
                    <Heading size="h4" color="white" className="mb-2">Legal Requirements</Heading>
                    <Text size="sm">
                      We may disclose your information if required by law, court order, or to protect our 
                      legal rights, prevent fraud, or ensure public safety.
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Retention */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                6. Data Retention
              </Heading>
              <div className="space-y-3 text-gray-300">
                <Text>
                  We retain your personal information only as long as necessary for the purposes outlined in this policy:
                </Text>
                <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <Text weight="semibold" className="mb-2">Customer Data</Text>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Active accounts: Duration of relationship</li>
                        <li>Booking history: 7 years (tax requirements)</li>
                        <li>Inactive accounts: 3 years maximum</li>
                        <li>Marketing data: Until opt-out or 2 years</li>
                      </ul>
                    </div>
                    <div>
                      <Text weight="semibold" className="mb-2">Technical Data</Text>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Website analytics: 26 months (Google default)</li>
                        <li>Security logs: 12 months</li>
                        <li>Email delivery logs: 90 days</li>
                        <li>Error reports: 6 months</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Rights */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                7. Your Rights Under UK GDPR
              </Heading>
              <div className="space-y-4 text-gray-300">
                <Text>
                  You have the following rights regarding your personal data:
                </Text>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3">
                      <Text weight="semibold" className="text-blue-400 mb-1">Right to Access</Text>
                      <Text size="sm">Request copies of your personal information</Text>
                    </div>
                    
                    <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                      <Text weight="semibold" className="text-green-400 mb-1">Right to Rectification</Text>
                      <Text size="sm">Correct inaccurate personal information</Text>
                    </div>
                    
                    <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3">
                      <Text weight="semibold" className="text-red-400 mb-1">Right to Erasure</Text>
                      <Text size="sm">Request deletion of your personal data</Text>
                    </div>
                    
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                      <Text weight="semibold" className="text-yellow-400 mb-1">Right to Restrict Processing</Text>
                      <Text size="sm">Limit how we use your personal data</Text>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-3">
                      <Text weight="semibold" className="text-purple-400 mb-1">Right to Data Portability</Text>
                      <Text size="sm">Transfer your data to another service</Text>
                    </div>
                    
                    <div className="bg-orange-900/20 border border-orange-600/30 rounded-lg p-3">
                      <Text weight="semibold" className="text-orange-400 mb-1">Right to Object</Text>
                      <Text size="sm">Object to processing for marketing purposes</Text>
                    </div>
                    
                    <div className="bg-teal-900/20 border border-teal-600/30 rounded-lg p-3">
                      <Text weight="semibold" className="text-teal-400 mb-1">Right to Withdraw Consent</Text>
                      <Text size="sm">Remove consent for data processing</Text>
                    </div>
                    
                    <div className="bg-pink-900/20 border border-pink-600/30 rounded-lg p-3">
                      <Text weight="semibold" className="text-pink-400 mb-1">Right to Complain</Text>
                      <Text size="sm">Lodge a complaint with the ICO</Text>
                    </div>
                  </div>
                </div>

                <div className="bg-brand-900/30 border border-brand-600/50 rounded-lg p-4 mt-4">
                  <Heading size="h4" color="white" className="mb-2">How to Exercise Your Rights</Heading>
                  <Text size="sm">
                    To exercise any of these rights, contact us at{' '}
                    <Link href={`mailto:${process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'zell@love4detailing.com'}`} className="text-brand-400 hover:text-brand-300 underline">
                      {process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'zell@love4detailing.com'}
                    </Link>{' '}
                    or call{' '}
                    <Link href="tel:+447908625581" className="text-brand-400 hover:text-brand-300 underline">
                      +44 7908 625581
                    </Link>.
                    We will respond within 30 days of your request.
                  </Text>
                </div>
              </div>
            </div>

            {/* Data Security */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                8. Data Security
              </Heading>
              <div className="space-y-3 text-gray-300">
                <Text>
                  We implement appropriate technical and organizational measures to protect your personal data:
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                    <Heading size="h4" color="white" className="mb-2">Technical Measures</Heading>
                    <ul className="space-y-1 text-sm list-disc list-inside">
                      <li>HTTPS encryption for all data transmission</li>
                      <li>Encrypted database storage</li>
                      <li>Secure authentication and access controls</li>
                      <li>Regular security updates and patches</li>
                      <li>Automated backups with encryption</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                    <Heading size="h4" color="white" className="mb-2">Organizational Measures</Heading>
                    <ul className="space-y-1 text-sm list-disc list-inside">
                      <li>Limited access to personal data</li>
                      <li>Regular staff training on data protection</li>
                      <li>Data breach response procedures</li>
                      <li>Privacy by design principles</li>
                      <li>Regular security assessments</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Cookies */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                9. Cookies and Analytics
              </Heading>
              <div className="space-y-3 text-gray-300">
                <Text>
                  Our website uses cookies and similar technologies to improve your experience:
                </Text>
                <div className="space-y-4">
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                    <Heading size="h4" color="white" className="mb-2">Essential Cookies</Heading>
                    <Text size="sm">
                      Required for basic website functionality, user authentication, and service delivery. 
                      These cannot be disabled.
                    </Text>
                  </div>
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                    <Heading size="h4" color="white" className="mb-2">Analytics Cookies (Google Analytics)</Heading>
                    <Text size="sm">
                      Help us understand how visitors use our website to improve our services. 
                      Data is anonymized and aggregated. You can opt out through your browser settings.
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            {/* International Transfers */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                10. International Data Transfers
              </Heading>
              <div className="space-y-3 text-gray-300">
                <Text>
                  Some of our service providers may process your data outside the UK. We ensure adequate 
                  protection through:
                </Text>
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li>European Commission adequacy decisions</li>
                  <li>Standard Contractual Clauses (SCCs)</li>
                  <li>Provider certification schemes (Privacy Shield successors)</li>
                  <li>Regular assessment of transfer mechanisms</li>
                </ul>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                11. Contact Us
              </Heading>
              <div className="space-y-4 text-gray-300">
                <Text>
                  If you have questions about this Privacy Policy or how we handle your personal data:
                </Text>
                
                <div className="bg-brand-900/30 border border-brand-600/50 rounded-lg p-6">
                  <Heading size="h3" color="white" className="mb-4">Data Protection Contact</Heading>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Text weight="semibold" className="mb-2">Love 4 Detailing</Text>
                      <div className="space-y-1 text-sm">
                        <Text>Email: {process.env.NEXT_PUBLIC_COMPANY_EMAIL || 'zell@love4detailing.com'}</Text>
                        <Text>Phone: +44 7908 625581</Text>
                        <Text>Service Area: South London, UK</Text>
                      </div>
                    </div>
                    <div>
                      <Text weight="semibold" className="mb-2">ICO Registration</Text>
                      <Text size="sm" className="mb-2">
                        If you're not satisfied with our response, you can complain to the Information Commissioner's Office:
                      </Text>
                      <div className="space-y-1 text-sm">
                        <Text>Website: ico.org.uk</Text>
                        <Text>Phone: 0303 123 1113</Text>
                        <Text>Post: Information Commissioner's Office</Text>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Policy Updates */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                12. Policy Updates
              </Heading>
              <div className="space-y-3 text-gray-300">
                <Text>
                  We may update this Privacy Policy to reflect changes in our practices or legal requirements. 
                  When we make significant changes:
                </Text>
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li>We will update the "Last updated" date at the top of this page</li>
                  <li>We will notify existing customers by email of material changes</li>
                  <li>We will provide 30 days notice before changes take effect</li>
                  <li>Continued use of our services constitutes acceptance of updates</li>
                </ul>
                
                <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mt-4">
                  <Text size="sm" weight="semibold" className="text-yellow-400 mb-1">
                    Current Version: 1.0
                  </Text>
                  <Text size="sm">
                    This is the initial version of our Privacy Policy, effective from {lastUpdated}.
                  </Text>
                </div>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="border-t border-gray-700 pt-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="/terms-of-service" 
                    className="text-brand-400 hover:text-brand-300 underline text-sm"
                  >
                    Terms of Service
                  </Link>
                  <Link 
                    href="/" 
                    className="text-brand-400 hover:text-brand-300 underline text-sm"
                  >
                    Back to Home
                  </Link>
                  <Link 
                    href="/book" 
                    className="text-brand-400 hover:text-brand-300 underline text-sm"
                  >
                    Book Service
                  </Link>
                </div>
                <Text size="xs" color="muted">
                  © 2024 Love 4 Detailing. All rights reserved.
                </Text>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </MainLayout>
  )
}