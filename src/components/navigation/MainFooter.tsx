'use client'

import { PhoneIcon, MailIcon, MapPinIcon, ClockIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function MainFooter() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    services: [
      { name: 'Exterior Detailing', href: '/services/exterior' },
      { name: 'Interior Detailing', href: '/services/interior' },
      { name: 'Paint Correction', href: '/services/paint-correction' },
      { name: 'Ceramic Coating', href: '/services/ceramic-coating' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Our Process', href: '/process' },
      { name: 'Service Areas', href: '/areas' },
      { name: 'Reviews', href: '/reviews' },
    ],
    support: [
      { name: 'Contact Us', href: '/contact' },
      { name: 'Booking Policies', href: '/booking-policies' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Support', href: '/support' },
    ],
  }

  return (
    <footer className="bg-[var(--bg-secondary)] border-t border-[var(--border-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Love 4 Detailing"
                width={48}
                height={48}
                className="rounded-lg"
              />
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Love 4 Detailing
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  Professional Mobile Car Detailing
                </p>
              </div>
            </div>
            
            <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
              Premium mobile car detailing services bringing professional care directly to your location. 
              We transform your vehicle with meticulous attention to detail and exceptional customer service.
            </p>

            {/* Contact Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <PhoneIcon className="w-4 h-4 text-[var(--primary)]" />
                <a 
                  href="tel:+441234567890"
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                >
                  01234 567890
                </a>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <MailIcon className="w-4 h-4 text-[var(--primary)]" />
                <a 
                  href="mailto:bookings@love4detailing.com"
                  className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                >
                  bookings@love4detailing.com
                </a>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <MapPinIcon className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-[var(--text-secondary)]">
                  Nottingham & Surrounding Areas
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <ClockIcon className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-[var(--text-secondary)]">
                  Mon-Sat: 8AM-6PM, Sun: 10AM-4PM
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[var(--text-primary)] font-semibold mb-4">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[var(--text-primary)] font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[var(--text-primary)] font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-[var(--border-secondary)]">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-[var(--text-muted)]">
              <p>&copy; {currentYear} Love 4 Detailing. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <Link 
                  href="/privacy" 
                  className="hover:text-[var(--primary)] transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms" 
                  className="hover:text-[var(--primary)] transition-colors"
                >
                  Terms of Service
                </Link>
                <Link 
                  href="/booking-policies" 
                  className="hover:text-[var(--primary)] transition-colors"
                >
                  Booking Policies
                </Link>
              </div>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                🛡️ Fully Insured
              </span>
              <span className="flex items-center gap-1">
                ⭐ 5-Star Rated
              </span>
              <span className="flex items-center gap-1">
                📱 Mobile Service
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}