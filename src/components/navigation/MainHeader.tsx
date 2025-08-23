'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { ResponsiveLogo } from '@/components/ui/primitives/Logo'
import { MenuIcon, XIcon, PhoneIcon, MailIcon, User, Settings, LogOut, Home } from 'lucide-react'
import Link from 'next/link'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

export function MainHeader() {
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [profile, setProfile] = useState<{ first_name?: string, role?: string } | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ]

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/user')
        const data = await response.json()
        
        if (data.success && data.data?.authenticated) {
          setIsAuthenticated(true)
          setProfile(data.data.user)
        } else {
          setIsAuthenticated(false)
          setProfile(null)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
        setProfile(null)
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [])

  return (
    <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] sticky top-0 z-50" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center flex-1 sm:flex-initial">
            <Link href="/" className="flex items-center w-full sm:w-auto">
              <div className="w-full sm:w-auto">
                <ResponsiveLogo 
                  href="/"
                  priority={true}
                  className="w-full sm:w-auto justify-center sm:justify-start"
                />
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
                <span className="hidden xl:inline">Contact</span>
              </a>
            </div>

            {/* Auth Buttons */}
            {!authLoading && (
              <div className="flex items-center gap-3">
                {isAuthenticated && profile ? (
                  // Authenticated user - show Dashboard and user menu
                  <>
                    <Button
                      onClick={() => router.push(profile.role === 'admin' || profile.role === 'super_admin' ? '/admin' : '/dashboard')}
                      variant="outline"
                      size="sm"
                    >
                      Dashboard
                    </Button>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <User className="w-4 h-4 text-[var(--primary)]" />
                      <span className="text-sm">Hi, {profile?.first_name || 'User'}</span>
                    </div>
                  </>
                ) : (
                  // Unauthenticated user - show login and book buttons
                  <>
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
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile CTA */}
          <div className="md:hidden flex items-center gap-2">
            {!authLoading && !isAuthenticated && (
              <Button
                onClick={() => router.push('/book')}
                size="sm"
                className="bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
              >
                Book Now
              </Button>
            )}
            
            {!authLoading && isAuthenticated && profile && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-medium">
                  {profile?.first_name?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
            )}
            
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
                {!authLoading && (
                  <>
                    {isAuthenticated && profile ? (
                      // Authenticated mobile menu
                      <>
                        <Link
                          href={profile.role === 'admin' || profile.role === 'super_admin' ? '/admin' : '/dashboard'}
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium px-2"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <div className="px-2 pt-2">
                          <p className="text-xs text-[var(--text-muted)] mb-2">Signed in as:</p>
                          <p className="text-sm text-[var(--text-primary)]">{profile?.first_name || 'User'}</p>
                        </div>
                      </>
                    ) : (
                      // Unauthenticated mobile menu
                      <Link
                        href="/auth/login"
                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium px-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Login / Register
                      </Link>
                    )}
                  </>
                )}
                
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