'use client'

import { Button } from '@/components/ui/primitives/Button'
import { 
  ClockIcon, 
  ShieldCheckIcon, 
  CreditCardIcon, 
  CalendarIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XIcon,
  ArrowLeftIcon,
  PhoneIcon,
  MailIcon
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function BookingPoliciesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Love 4 Detailing"
              width={80}
              height={80}
              className="rounded-lg"
            />
          </div>
          
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
            Booking Policies & Terms
          </h1>
          <p className="text-xl text-[var(--text-secondary)]">
            Important information about our services and booking conditions
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div className="space-y-8">
          {/* Cancellation Policy */}
          <section className="bg-[var(--surface-secondary)] rounded-lg p-8 border border-[var(--border-secondary)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[var(--surface-tertiary)] rounded-lg p-3">
                <CalendarIcon className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Cancellation & Rescheduling Policy
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-[var(--warning-bg)] border border-[var(--warning)] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ClockIcon className="w-5 h-5 text-[var(--warning)] mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-[var(--warning)] mb-2">24-Hour Notice Required</h3>
                    <p className="text-[var(--warning)] text-sm">
                      All cancellations or rescheduling requests must be made at least 24 hours before your scheduled appointment time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--success-bg)] border border-[var(--success)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-[var(--success)] mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-[var(--success)] mb-2">Free Cancellation</h3>
                      <p className="text-[var(--success)] text-sm">
                        Cancel or reschedule with 24+ hours notice at no charge.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--error-bg)] border border-[var(--error)] rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XIcon className="w-5 h-5 text-[var(--error)] mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-[var(--error)] mb-2">Late Cancellation</h3>
                      <p className="text-[var(--error)] text-sm">
                        Cancellations with less than 24 hours notice may incur a £25 fee.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--surface-tertiary)] rounded-lg p-4">
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">How to Cancel or Reschedule</h3>
                <ul className="space-y-2 text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--primary)] mt-1">•</span>
                    <span>Call us at <a href="tel:+447908625581" className="text-[var(--text-link)] hover:text-[var(--text-link-hover)]">+44 7908 625581</a></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--primary)] mt-1">•</span>
                    <span>Email us at <a href="mailto:zell@love4detailing.com" className="text-[var(--text-link)] hover:text-[var(--text-link-hover)]">zell@love4detailing.com</a></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--primary)] mt-1">•</span>
                    <span>Use your customer dashboard (if registered)</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Payment Terms */}
          <section className="bg-[var(--surface-secondary)] rounded-lg p-8 border border-[var(--border-secondary)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[var(--surface-tertiary)] rounded-lg p-3">
                <CreditCardIcon className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Payment Terms
              </h2>
            </div>

            <div className="space-y-6">
              <div className="bg-[var(--info-bg)] border border-[var(--info)] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CreditCardIcon className="w-5 h-5 text-[var(--info)] mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-[var(--info)] mb-2">Payment Required in Advance</h3>
                    <p className="text-[var(--info)] text-sm">
                      Payment is required within 48 hours of booking confirmation to secure your appointment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--surface-tertiary)] rounded-lg p-4 text-center">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Cash</h3>
                  <p className="text-[var(--text-secondary)] text-sm">
                    Preferred payment method for instant settlement
                  </p>
                </div>
                
                <div className="bg-[var(--surface-tertiary)] rounded-lg p-4 text-center">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">PayPal</h3>
                  <p className="text-[var(--text-secondary)] text-sm">
                    Secure digital payment via PayPal
                  </p>
                </div>
                
                <div className="bg-[var(--surface-tertiary)] rounded-lg p-4 text-center">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-2">Card Payment</h3>
                  <p className="text-[var(--text-secondary)] text-sm">
                    Contactless and chip & PIN available
                  </p>
                </div>
              </div>

              <div className="bg-[var(--surface-tertiary)] rounded-lg p-4">
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">Pricing Policy</h3>
                <ul className="space-y-2 text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--primary)] mt-1">•</span>
                    <span>All prices are quoted upfront during booking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--primary)] mt-1">•</span>
                    <span>Travel surcharges apply beyond our free 17.5 mile radius</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--primary)] mt-1">•</span>
                    <span>Final pricing may be adjusted for significantly dirtier vehicles (with customer approval)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--primary)] mt-1">•</span>
                    <span>No hidden fees - what you&apos;re quoted is what you pay</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Service Requirements */}
          <section className="bg-[var(--surface-secondary)] rounded-lg p-8 border border-[var(--border-secondary)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[var(--surface-tertiary)] rounded-lg p-3">
                <ShieldCheckIcon className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Service Requirements
              </h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--surface-tertiary)] rounded-lg p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3">Site Requirements</h3>
                  <ul className="space-y-2 text-[var(--text-secondary)]">
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-1">•</span>
                      <span>Access to water supply (garden tap or similar)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-1">•</span>
                      <span>Access to electrical power (we bring extension leads)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-1">•</span>
                      <span>Level ground for safety</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-1">•</span>
                      <span>Vehicle not blocked in</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-[var(--surface-tertiary)] rounded-lg p-4">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3">Weather Policy</h3>
                  <ul className="space-y-2 text-[var(--text-secondary)]">
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-1">•</span>
                      <span>Services may be postponed in severe weather</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-1">•</span>
                      <span>Light rain doesn&apos;t affect most services</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--primary)] mt-1">•</span>
                      <span>Free rescheduling for weather-related cancellations</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-[var(--warning-bg)] border border-[var(--warning)] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangleIcon className="w-5 h-5 text-[var(--warning)] mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-[var(--warning)] mb-2">Important Notes</h3>
                    <ul className="space-y-1 text-[var(--warning)] text-sm">
                      <li>• Please remove all personal items from your vehicle before our arrival</li>
                      <li>• Ensure vehicle is accessible and keys are available</li>
                      <li>• Let us know about any vehicle damage or specific concerns in advance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Liability & Insurance */}
          <section className="bg-[var(--surface-secondary)] rounded-lg p-8 border border-[var(--border-secondary)]">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[var(--surface-tertiary)] rounded-lg p-3">
                <ShieldCheckIcon className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Insurance & Liability
              </h2>
            </div>

            <div className="space-y-4">
              <div className="bg-[var(--success-bg)] border border-[var(--success)] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-[var(--success)] mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-[var(--success)] mb-2">Fully Insured Service</h3>
                    <p className="text-[var(--success)] text-sm">
                      Love 4 Detailing carries comprehensive public liability insurance covering all our mobile services.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--surface-tertiary)] rounded-lg p-4">
                <h3 className="font-semibold text-[var(--text-primary)] mb-3">Coverage Details</h3>
                <ul className="space-y-2 text-[var(--text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--primary)] mt-1">•</span>
                    <span>Public liability insurance up to £2,000,000</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--primary)] mt-1">•</span>
                    <span>Professional indemnity for service-related issues</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--primary)] mt-1">•</span>
                    <span>Equipment and tools covered under business insurance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--primary)] mt-1">•</span>
                    <span>Pre-existing vehicle damage documented before service</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-[var(--surface-secondary)] rounded-lg p-8 border border-[var(--border-primary)]">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                Questions About Our Policies?
              </h2>
              <p className="text-[var(--text-secondary)] mb-6">
                Our team is here to help clarify any policies or answer your questions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => window.open('tel:+447908625581')}
                  className="flex items-center gap-2"
                >
                  <PhoneIcon className="w-4 h-4" />
                  Call Us: +44 7908 625581
                </Button>
                
                <Button
                  onClick={() => window.open('mailto:zell@love4detailing.com')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <MailIcon className="w-4 h-4" />
                  Email: zell@love4detailing.com
                </Button>
              </div>
              
              <p className="text-[var(--text-muted)] text-sm mt-6">
                Last updated: {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}