'use client'

import { PhoneIcon, MailIcon, MapPinIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

export function MainFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-surface-secondary border-t border-border-secondary" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo1.png"
                alt="Love 4 Detailing"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div>
                <h3 className="text-lg font-bold text-text-primary">
                  Love 4 Detailing
                </h3>
                <p className="text-sm text-text-secondary">
                  Professional Mobile Car Detailing
                </p>
              </div>
            </div>
            
            <p className="text-text-secondary text-sm leading-relaxed max-w-md">
              Premium mobile car detailing services in SW9 and surrounding South London areas.
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <PhoneIcon className="w-4 h-4 text-brand-400" />
              <a 
                href="tel:+447908625581"
                className="text-text-secondary hover:text-brand-400 transition-colors"
              >
                07908 625581
              </a>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <MailIcon className="w-4 h-4 text-brand-400" />
              <a 
                href="mailto:zell@love4detailing.com"
                className="text-text-secondary hover:text-brand-400 transition-colors"
              >
                zell@love4detailing.com
              </a>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <MapPinIcon className="w-4 h-4 text-brand-400" />
              <span className="text-text-secondary">
                SW9 & South London Areas
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-border-secondary">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-text-muted">
            <p>&copy; {currentYear} Love 4 Detailing. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link 
                href="/booking-policies" 
                className="hover:text-brand-400 transition-colors"
              >
                Booking Policies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}