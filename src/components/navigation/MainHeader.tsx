'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { MenuIcon, XIcon, PhoneIcon, MailIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function MainHeader() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  return (
    <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Love 4 Detailing"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-[var(--text-primary)]">
                  Love 4 Detailing
                </h1>
                <p className="text-xs text-[var(--text-secondary)]">
                  Professional Mobile Car Detailing
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Contact & CTA */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Quick Contact */}
            <div className="flex items-center gap-3 text-sm">
              <a 
                href="tel:+441234567890"
                className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
              >
                <PhoneIcon className="w-4 h-4" />
                <span>01234 567890</span>
              </a>
              <a 
                href="mailto:bookings@love4detailing.com"
                className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
              >
                <MailIcon className="w-4 h-4" />
                <span className="hidden xl:inline">Book Now</span>
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => router.push('/auth/login')}
                variant="outline"
                size="sm"
              >
                Login
              </Button>
              <Button
                onClick={() => router.push('/book')}
                size="sm"
                className="bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
              >
                Book Service
              </Button>
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              onClick={() => router.push('/book')}
              size="sm"
              className="bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
            >
              Book Now
            </Button>
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {isMenuOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-[var(--border-secondary)] py-4">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium px-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Auth Links */}
              <div className="flex flex-col gap-2 pt-4 border-t border-[var(--border-secondary)]">
                <Link
                  href="/auth/login"
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium px-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login / Register
                </Link>
                
                {/* Mobile Contact */}
                <div className="px-2 pt-2">
                  <p className="text-xs text-[var(--text-muted)] mb-2">Quick Contact:</p>
                  <div className="flex flex-col gap-1">
                    <a 
                      href="tel:+441234567890"
                      className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
                    >
                      📞 01234 567890
                    </a>
                    <a 
                      href="mailto:bookings@love4detailing.com"
                      className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
                    >
                      ✉️ bookings@love4detailing.com
                    </a>
                  </div>
                </div>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}