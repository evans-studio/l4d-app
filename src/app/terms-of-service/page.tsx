/**
 * Terms of Service Page
 * 
 * Comprehensive terms and conditions for Love4Detailing mobile car detailing services.
 * Covers booking, cancellation, payment, liability, and legal requirements.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { Container, Section } from '@/components/layout/templates/PageLayout'
import { Heading, Text } from '@/components/ui/primitives/Typography'
import { MainLayout } from '@/components/layouts/MainLayout'

export const metadata: Metadata = {
  title: 'Terms of Service | Love 4 Detailing',
  description: 'Terms and conditions for Love 4 Detailing mobile car detailing services in South London.',
  robots: 'index, follow'
}

export default function TermsOfServicePage() {
  const lastUpdated = '8th August 2024'
  const effectiveDate = '8th August 2024'

  return (
    <MainLayout>
      <Section padding="xl" background="transparent">
        <Container className="max-w-4xl">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <Heading size="h1" color="white" className="mb-4">
                Terms of Service
              </Heading>
              <div className="space-y-2">
                <Text size="lg" color="secondary">
                  Last updated: {lastUpdated}
                </Text>
                <Text size="sm" color="muted">
                  Effective date: {effectiveDate}
                </Text>
              </div>
            </div>

            {/* Introduction */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                1. Agreement to Terms
              </Heading>
              <div className="space-y-3 text-gray-300">
                <Text>
                  These Terms of Service ("Terms") constitute a legally binding agreement between you ("Customer," "you," or "your") 
                  and Love 4 Detailing ("Company," "we," "our," or "us") regarding your use of our mobile car detailing services.
                </Text>
                <div className="bg-brand-900/30 border border-brand-600/50 rounded-lg p-4">
                  <Text weight="semibold" className="text-brand-400 mb-2">Important Notice</Text>
                  <Text size="sm">
                    By booking our services, accessing our website, or using our platform, you agree to be bound by these Terms. 
                    If you do not agree to these Terms, please do not use our services.
                  </Text>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                  <Text weight="semibold" className="mb-2">Business Information:</Text>
                  <Text size="sm">
                    Love 4 Detailing<br />
                    Mobile Car Detailing Services<br />
                    Service Area: South London, United Kingdom<br />
                    Email: zell@love4detailing.com<br />
                    Phone: +44 7908 625581
                  </Text>
                </div>
              </div>
            </div>

            {/* Service Description */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                2. Service Description
              </Heading>
              <div className="space-y-4 text-gray-300">
                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    2.1 Services Offered
                  </Heading>
                  <Text className="mb-3">
                    Love 4 Detailing provides professional mobile car detailing services, including but not limited to:
                  </Text>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                      <Heading size="h4" color="white" className="mb-2">Exterior Services</Heading>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        <li>Exterior wash and dry</li>
                        <li>Paint decontamination</li>
                        <li>Wheel and tire cleaning</li>
                        <li>Glass cleaning</li>
                        <li>Paint protection application</li>
                      </ul>
                    </div>
                    <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
                      <Heading size="h4" color="white" className="mb-2">Interior Services</Heading>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        <li>Interior vacuuming</li>
                        <li>Dashboard and console cleaning</li>
                        <li>Seat cleaning and conditioning</li>
                        <li>Carpet and upholstery treatment</li>
                        <li>Interior protection application</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    2.2 Service Area
                  </Heading>
                  <Text>
                    Our services are available throughout South London. We operate within approximately 17.5 miles 
                    of our base location. Service availability may vary based on location, weather conditions, 
                    and operational capacity.
                  </Text>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    2.3 Service Standards
                  </Heading>
                  <ul className="space-y-2 list-disc list-inside text-sm">
                    <li>All services performed by trained and insured professionals</li>
                    <li>Use of professional-grade equipment and eco-friendly products</li>
                    <li>Services performed at your chosen location (subject to access requirements)</li>
                    <li>Estimated service duration provided at time of booking</li>
                    <li>Post-service quality check and customer satisfaction confirmation</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Booking and Scheduling */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                3. Booking and Scheduling
              </Heading>
              <div className="space-y-4 text-gray-300">
                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    3.1 Booking Process
                  </Heading>
                  <div className="space-y-3">
                    <Text>
                      Bookings can be made through our website, by phone, or via email. All bookings are subject to availability 
                      and our acceptance of the booking request.
                    </Text>
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                      <Text weight="semibold" className="text-yellow-400 mb-2">Booking Requirements</Text>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        <li>Valid contact information (name, phone, email)</li>
                        <li>Service address with adequate access</li>
                        <li>Vehicle information (make, model, size)</li>
                        <li>Preferred date and time selection</li>
                        <li>Special requirements or requests</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    3.2 Booking Confirmation
                  </Heading>
                  <Text>
                    Bookings are not confirmed until you receive written confirmation from us via email or SMS. 
                    We reserve the right to decline bookings at our discretion.
                  </Text>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    3.3 Scheduling and Rescheduling
                  </Heading>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                        <Text weight="semibold" className="text-green-400 mb-2">Standard Scheduling</Text>
                        <ul className="space-y-1 text-sm list-disc list-inside">
                          <li>Advance booking recommended</li>
                          <li>Same-day booking subject to availability</li>
                          <li>Time slots allocated in 30-minute intervals</li>
                          <li>Service duration estimates provided</li>
                        </ul>
                      </div>
                      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                        <Text weight="semibold" className="text-blue-400 mb-2">Rescheduling Policy</Text>
                        <ul className="space-y-1 text-sm list-disc list-inside">
                          <li>24+ hours notice: Free rescheduling</li>
                          <li>12-24 hours notice: Subject to availability</li>
                          <li>Less than 12 hours: May incur fees</li>
                          <li>Weather-related changes: No charges</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing and Payment */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                4. Pricing and Payment
              </Heading>
              <div className="space-y-4 text-gray-300">
                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    4.1 Pricing Structure
                  </Heading>
                  <div className="space-y-3">
                    <Text>
                      Service prices are determined based on service type, vehicle size, condition, and any special requirements. 
                      All prices include VAT where applicable.
                    </Text>
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                      <Heading size="h4" color="white" className="mb-2">Price Factors</Heading>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <Text weight="semibold" className="mb-1">Vehicle Size</Text>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Small (hatchback, small sedan)</li>
                            <li>Medium (large sedan, small SUV)</li>
                            <li>Large (large SUV, van)</li>
                          </ul>
                        </div>
                        <div>
                          <Text weight="semibold" className="mb-1">Service Level</Text>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Basic wash and dry</li>
                            <li>Standard detailing</li>
                            <li>Premium full valet</li>
                          </ul>
                        </div>
                        <div>
                          <Text weight="semibold" className="mb-1">Additional Factors</Text>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Vehicle condition</li>
                            <li>Special requests</li>
                            <li>Travel distance</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    4.2 Payment Terms
                  </Heading>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-brand-900/20 border border-brand-600/30 rounded-lg p-4">
                        <Text weight="semibold" className="text-brand-400 mb-2">Payment Methods</Text>
                        <ul className="space-y-1 text-sm list-disc list-inside">
                          <li>PayPal (online payments)</li>
                          <li>Bank transfer</li>
                          <li>Cash on completion</li>
                          <li>Card payment (where available)</li>
                        </ul>
                      </div>
                      <div className="bg-orange-900/20 border border-orange-600/30 rounded-lg p-4">
                        <Text weight="semibold" className="text-orange-400 mb-2">Payment Timeline</Text>
                        <ul className="space-y-1 text-sm list-disc list-inside">
                          <li>Payment due on service completion</li>
                          <li>Online payments: Immediate processing</li>
                          <li>Invoice payments: 7 days maximum</li>
                          <li>Late payment fees may apply</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                      <Text weight="semibold" className="text-red-400 mb-2">Important Payment Notes</Text>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        <li>Prices quoted are final unless additional work is requested</li>
                        <li>Payment must be made before we leave the service location</li>
                        <li>Disputed charges must be raised within 24 hours of service completion</li>
                        <li>We reserve the right to refuse service for non-payment of previous invoices</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancellation Policy */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                5. Cancellation and Refund Policy
              </Heading>
              <div className="space-y-4 text-gray-300">
                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    5.1 Customer Cancellations
                  </Heading>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                        <Text weight="semibold" className="text-green-400 mb-2">24+ Hours Notice</Text>
                        <ul className="space-y-1 text-sm list-disc list-inside">
                          <li>Full refund or reschedule</li>
                          <li>No cancellation fees</li>
                          <li>Easy online cancellation</li>
                        </ul>
                      </div>
                      <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                        <Text weight="semibold" className="text-yellow-400 mb-2">12-24 Hours Notice</Text>
                        <ul className="space-y-1 text-sm list-disc list-inside">
                          <li>50% refund available</li>
                          <li>Rescheduling preferred</li>
                          <li>Case-by-case assessment</li>
                        </ul>
                      </div>
                      <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                        <Text weight="semibold" className="text-red-400 mb-2">Less than 12 Hours</Text>
                        <ul className="space-y-1 text-sm list-disc list-inside">
                          <li>Limited refund available</li>
                          <li>Travel costs may apply</li>
                          <li>Emergency exceptions considered</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    5.2 Service Provider Cancellations
                  </Heading>
                  <div className="space-y-3">
                    <Text>
                      We may need to cancel or reschedule services due to:
                    </Text>
                    <ul className="space-y-2 list-disc list-inside text-sm">
                      <li><strong>Weather conditions:</strong> Rain, extreme temperatures, or unsafe working conditions</li>
                      <li><strong>Equipment failure:</strong> Vehicle breakdown or equipment malfunction</li>
                      <li><strong>Staff illness:</strong> Unexpected unavailability of service personnel</li>
                      <li><strong>Access issues:</strong> Inability to access service location safely</li>
                      <li><strong>Emergency situations:</strong> Unforeseen circumstances beyond our control</li>
                    </ul>
                    
                    <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mt-4">
                      <Text weight="semibold" className="text-blue-400 mb-2">Our Commitment</Text>
                      <Text size="sm">
                        If we cancel your service, we will provide at least 2 hours notice when possible, 
                        offer alternative scheduling options, and provide full refund if rescheduling is not suitable.
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Delivery */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                6. Service Delivery and Requirements
              </Heading>
              <div className="space-y-4 text-gray-300">
                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    6.1 Customer Responsibilities
                  </Heading>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                      <Text weight="semibold" className="mb-2">Before Service</Text>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        <li>Ensure vehicle access and parking availability</li>
                        <li>Remove personal items from vehicle interior</li>
                        <li>Provide water and electricity access where possible</li>
                        <li>Inform us of any vehicle damage or concerns</li>
                        <li>Ensure someone is available during service time</li>
                      </ul>
                    </div>
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                      <Text weight="semibold" className="mb-2">During Service</Text>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        <li>Provide reasonable access to work area</li>
                        <li>Keep pets secure and away from work area</li>
                        <li>Allow our team to work without interruption</li>
                        <li>Report any concerns immediately</li>
                        <li>Be available for service completion sign-off</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    6.2 Service Conditions
                  </Heading>
                  <div className="space-y-3">
                    <Text>
                      Our services are subject to the following conditions:
                    </Text>
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
                      <Text weight="semibold" className="text-yellow-400 mb-2">Service Limitations</Text>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        <li>We cannot guarantee removal of all stains or damage</li>
                        <li>Pre-existing vehicle damage will be noted but not repaired</li>
                        <li>Services may take longer than estimated based on vehicle condition</li>
                        <li>Additional charges may apply for excessively dirty vehicles</li>
                        <li>We reserve the right to refuse service for unsafe or inappropriate vehicles</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Liability and Insurance */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                7. Liability and Insurance
              </Heading>
              <div className="space-y-4 text-gray-300">
                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    7.1 Our Insurance Coverage
                  </Heading>
                  <div className="space-y-3">
                    <Text>
                      Love 4 Detailing maintains comprehensive business insurance including:
                    </Text>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                        <Text weight="semibold" className="text-green-400 mb-2">Coverage Included</Text>
                        <ul className="space-y-1 text-sm list-disc list-inside">
                          <li>Public liability insurance</li>
                          <li>Professional indemnity insurance</li>
                          <li>Equipment and tool coverage</li>
                          <li>Vehicle-in-care coverage</li>
                        </ul>
                      </div>
                      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                        <Text weight="semibold" className="text-blue-400 mb-2">Claims Process</Text>
                        <ul className="space-y-1 text-sm list-disc list-inside">
                          <li>Immediate damage reporting required</li>
                          <li>Photo evidence and documentation</li>
                          <li>Insurance assessment process</li>
                          <li>Direct insurance company liaison</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    7.2 Liability Limitations
                  </Heading>
                  <div className="space-y-3">
                    <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                      <Text weight="semibold" className="text-red-400 mb-2">Important Limitations</Text>
                      <ul className="space-y-2 text-sm list-disc list-inside">
                        <li>
                          <strong>Pre-existing Damage:</strong> We are not liable for pre-existing vehicle damage, 
                          wear and tear, or defects not caused by our services
                        </li>
                        <li>
                          <strong>Personal Property:</strong> We are not responsible for personal items left in vehicles. 
                          Customers must remove valuables before service
                        </li>
                        <li>
                          <strong>Indirect Damages:</strong> Our liability is limited to direct damages caused by our negligence. 
                          We are not liable for consequential losses, lost profits, or indirect damages
                        </li>
                        <li>
                          <strong>Maximum Liability:</strong> Our total liability is limited to the amount paid for services, 
                          except in cases of gross negligence
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mt-4">
                      <Text weight="semibold" className="text-yellow-400 mb-2">Damage Reporting</Text>
                      <Text size="sm">
                        Any damage must be reported immediately upon discovery and before our team leaves the service location. 
                        Claims reported after service completion may not be accepted.
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Obligations */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                8. Customer Obligations and Conduct
              </Heading>
              <div className="space-y-4 text-gray-300">
                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    8.1 Acceptable Use
                  </Heading>
                  <div className="space-y-3">
                    <Text>
                      By using our services, you agree to:
                    </Text>
                    <ul className="space-y-2 list-disc list-inside text-sm">
                      <li>Provide accurate and complete information during booking</li>
                      <li>Treat our staff with respect and courtesy</li>
                      <li>Follow all safety instructions and recommendations</li>
                      <li>Make timely payments as agreed</li>
                      <li>Allow reasonable access for service delivery</li>
                      <li>Report any issues or concerns promptly and constructively</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    8.2 Prohibited Conduct
                  </Heading>
                  <div className="space-y-3">
                    <Text>
                      The following conduct is strictly prohibited:
                    </Text>
                    <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                      <ul className="space-y-2 text-sm list-disc list-inside">
                        <li>Abusive, threatening, or discriminatory behavior toward our staff</li>
                        <li>Providing false or misleading information</li>
                        <li>Requesting services for illegal activities or purposes</li>
                        <li>Interfering with our equipment or work processes</li>
                        <li>Attempting to circumvent our booking or payment systems</li>
                        <li>Recording or photographing our staff without consent</li>
                      </ul>
                    </div>
                    
                    <div className="bg-orange-900/20 border border-orange-600/30 rounded-lg p-4 mt-4">
                      <Text weight="semibold" className="text-orange-400 mb-2">Consequences</Text>
                      <Text size="sm">
                        Violation of these terms may result in immediate service termination, 
                        account suspension, and potential legal action. Full payment is still required 
                        for services rendered prior to termination.
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                9. Intellectual Property and Privacy
              </Heading>
              <div className="space-y-4 text-gray-300">
                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    9.1 Our Intellectual Property
                  </Heading>
                  <Text>
                    All content on our website, marketing materials, and service methods are protected by copyright, 
                    trademark, and other intellectual property laws. You may not reproduce, distribute, or use our 
                    content without written permission.
                  </Text>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    9.2 Photography and Marketing
                  </Heading>
                  <div className="space-y-3">
                    <Text>
                      We may take before/after photographs of our work for quality control and marketing purposes. 
                      By using our services, you consent to such photography unless you explicitly opt out.
                    </Text>
                    
                    <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                      <Text weight="semibold" className="text-blue-400 mb-2">Photo Usage Rights</Text>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        <li>Before/after vehicle photos for portfolio use</li>
                        <li>Social media and website marketing content</li>
                        <li>Training and quality improvement materials</li>
                        <li>No personal information or license plates in marketing use</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    9.3 Privacy and Data Protection
                  </Heading>
                  <Text>
                    Your personal information is protected under our comprehensive{' '}
                    <Link href="/privacy-policy" className="text-brand-400 hover:text-brand-300 underline">
                      Privacy Policy
                    </Link>, which complies with UK GDPR requirements. Please review our Privacy Policy to understand 
                    how we collect, use, and protect your personal data.
                  </Text>
                </div>
              </div>
            </div>

            {/* Dispute Resolution */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                10. Dispute Resolution and Complaints
              </Heading>
              <div className="space-y-4 text-gray-300">
                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    10.1 Complaint Process
                  </Heading>
                  <div className="space-y-4">
                    <Text>
                      We are committed to resolving any issues promptly and fairly. If you have a complaint:
                    </Text>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                        <Text weight="semibold" className="text-blue-400 mb-2">Step 1: Direct Contact</Text>
                        <ul className="space-y-1 text-sm list-disc list-inside">
                          <li>Contact us immediately</li>
                          <li>Explain the issue clearly</li>
                          <li>Provide supporting evidence</li>
                          <li>Request specific resolution</li>
                        </ul>
                      </div>
                      <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                        <Text weight="semibold" className="text-green-400 mb-2">Step 2: Investigation</Text>
                        <ul className="space-y-1 text-sm list-disc list-inside">
                          <li>We investigate within 48 hours</li>
                          <li>Review evidence and records</li>
                          <li>Consult with service team</li>
                          <li>Assess appropriate resolution</li>
                        </ul>
                      </div>
                      <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4">
                        <Text weight="semibold" className="text-purple-400 mb-2">Step 3: Resolution</Text>
                        <ul className="space-y-1 text-sm list-disc list-inside">
                          <li>Provide written response</li>
                          <li>Offer appropriate remedy</li>
                          <li>Implement corrective actions</li>
                          <li>Follow up on satisfaction</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    10.2 Alternative Dispute Resolution
                  </Heading>
                  <div className="space-y-3">
                    <Text>
                      If we cannot resolve your complaint through direct discussion, we are committed to 
                      alternative dispute resolution methods before pursuing formal legal action.
                    </Text>
                    
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                      <Text weight="semibold" className="mb-2">Available Options</Text>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        <li>Independent mediation services</li>
                        <li>Industry ombudsman schemes (where applicable)</li>
                        <li>Citizens Advice consumer services</li>
                        <li>Trading Standards guidance</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    10.3 Legal Jurisdiction
                  </Heading>
                  <Text>
                    These Terms are governed by English law. Any legal disputes will be subject to the 
                    exclusive jurisdiction of the courts of England and Wales.
                  </Text>
                </div>
              </div>
            </div>

            {/* Force Majeure */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                11. Force Majeure
              </Heading>
              <div className="space-y-3 text-gray-300">
                <Text>
                  We shall not be liable for any failure or delay in performing our obligations if such failure 
                  or delay results from circumstances beyond our reasonable control, including but not limited to:
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                    <Text weight="semibold" className="mb-2">Natural Events</Text>
                    <ul className="space-y-1 text-sm list-disc list-inside">
                      <li>Severe weather conditions</li>
                      <li>Natural disasters</li>
                      <li>Flooding or other environmental hazards</li>
                      <li>Acts of God</li>
                    </ul>
                  </div>
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
                    <Text weight="semibold" className="mb-2">Human Events</Text>
                    <ul className="space-y-1 text-sm list-disc list-inside">
                      <li>Government actions or restrictions</li>
                      <li>Public health emergencies</li>
                      <li>Labor strikes or disputes</li>
                      <li>Civil unrest or terrorism</li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mt-4">
                  <Text weight="semibold" className="text-yellow-400 mb-2">Force Majeure Response</Text>
                  <Text size="sm">
                    In the event of force majeure circumstances, we will make reasonable efforts to 
                    minimize disruption, provide advance notice where possible, and offer alternative 
                    arrangements or full refunds as appropriate.
                  </Text>
                </div>
              </div>
            </div>

            {/* Modification and Termination */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                12. Modification and Termination
              </Heading>
              <div className="space-y-4 text-gray-300">
                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    12.1 Terms Modification
                  </Heading>
                  <div className="space-y-3">
                    <Text>
                      We reserve the right to modify these Terms at any time. When we make material changes:
                    </Text>
                    <ul className="space-y-2 list-disc list-inside text-sm">
                      <li>We will update the "Last updated" date at the top of these Terms</li>
                      <li>We will notify existing customers by email at least 30 days before changes take effect</li>
                      <li>Changes will not apply to bookings already confirmed before the effective date</li>
                      <li>Continued use of our services after changes take effect constitutes acceptance</li>
                      <li>You may cancel existing bookings without penalty if you disagree with material changes</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    12.2 Service Termination
                  </Heading>
                  <div className="space-y-3">
                    <Text>
                      We may suspend or terminate services to customers who:
                    </Text>
                    <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        <li>Violate these Terms of Service</li>
                        <li>Engage in abusive or threatening behavior</li>
                        <li>Fail to make required payments</li>
                        <li>Provide false or fraudulent information</li>
                        <li>Repeatedly cancel or reschedule without valid reason</li>
                      </ul>
                    </div>
                    
                    <Text className="mt-3">
                      Termination does not relieve customers of payment obligations for services already provided.
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                13. Contact Information
              </Heading>
              <div className="space-y-4 text-gray-300">
                <Text>
                  For questions about these Terms of Service, to report issues, or to request services:
                </Text>
                
                <div className="bg-brand-900/30 border border-brand-600/50 rounded-lg p-6">
                  <Heading size="h3" color="white" className="mb-4">Love 4 Detailing</Heading>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Text weight="semibold" className="mb-2">Contact Details</Text>
                      <div className="space-y-1 text-sm">
                        <Text>📧 Email: zell@love4detailing.com</Text>
                        <Text>📞 Phone: +44 7908 625581</Text>
                        <Text>🌍 Service Area: South London, UK</Text>
                        <Text>🕒 Business Hours: 8 AM - 6 PM, Mon-Sat</Text>
                      </div>
                    </div>
                    <div>
                      <Text weight="semibold" className="mb-2">Online Services</Text>
                      <div className="space-y-1 text-sm">
                        <Text>🌐 Website: love4detailing.com</Text>
                        <Text>📱 Online Booking: Available 24/7</Text>
                        <Text>📧 Customer Support: Same-day response</Text>
                        <Text>⚡ Emergency Contact: Text/Call mobile</Text>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Final Provisions */}
            <div className="space-y-4">
              <Heading size="h2" color="white">
                14. Final Provisions
              </Heading>
              <div className="space-y-4 text-gray-300">
                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    14.1 Severability
                  </Heading>
                  <Text>
                    If any provision of these Terms is found to be invalid or unenforceable, the remaining 
                    provisions will continue in full force and effect.
                  </Text>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    14.2 Entire Agreement
                  </Heading>
                  <Text>
                    These Terms, together with our Privacy Policy, constitute the entire agreement between 
                    you and Love 4 Detailing regarding the use of our services.
                  </Text>
                </div>

                <div>
                  <Heading size="h3" color="white" className="mb-2">
                    14.3 No Waiver
                  </Heading>
                  <Text>
                    Our failure to enforce any provision of these Terms does not constitute a waiver of that 
                    provision or our right to enforce it in the future.
                  </Text>
                </div>

                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4 mt-6">
                  <Text weight="semibold" className="text-green-400 mb-2">Terms Acknowledgment</Text>
                  <Text size="sm">
                    By booking our services or using our website, you acknowledge that you have read, 
                    understood, and agree to be bound by these Terms of Service and our Privacy Policy.
                  </Text>
                </div>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="border-t border-gray-700 pt-8">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex flex-wrap gap-4">
                  <Link 
                    href="/privacy-policy" 
                    className="text-brand-400 hover:text-brand-300 underline text-sm"
                  >
                    Privacy Policy
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
                  <Link 
                    href="mailto:zell@love4detailing.com" 
                    className="text-brand-400 hover:text-brand-300 underline text-sm"
                  >
                    Contact Us
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