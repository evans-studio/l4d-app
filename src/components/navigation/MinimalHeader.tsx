'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-compat'
import { Button } from '@/components/ui/primitives/Button'
import { Menu, X, User, Settings, LogOut, Home, Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MinimalHeaderProps {
  className?: string
  showMobileMenu?: boolean // Control whether to show mobile hamburger menu
}

// User menu dropdown component
const UserMenu: React.FC<{ 
  user: any
  profile: any 
  onLogout: () => void 
}> = ({ user, profile, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const router = useRouter()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  const handleProfileClick = () => {
    router.push(isAdmin ? '/admin/settings' : '/dashboard/settings')
    setIsOpen(false)
  }

  const handleDashboardClick = () => {
    router.push(isAdmin ? '/admin' : '/dashboard')
    setIsOpen(false)
  }

  const handleLogoutClick = async () => {
    setIsOpen(false)
    await onLogout()
  }

  // Calculate dropdown position based on available space
  const calculateDropdownPosition = () => {
    const viewportHeight = window.innerHeight
    const scrollY = window.scrollY
    const headerHeight = 64 // Approximate header height
    const dropdownHeight = 200 // Approximate dropdown height
    
    // If we're near the top of the page and there's not enough space below
    const spaceBelow = viewportHeight - headerHeight
    const spaceAbove = scrollY + headerHeight
    
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition('top')
    } else {
      setDropdownPosition('bottom')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-user-menu]')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
    
    return undefined
  }, [isOpen])

  // Generate user initials for avatar
  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    }
    if (profile?.first_name) {
      return profile.first_name[0].toUpperCase()
    }
    return user?.email?.[0]?.toUpperCase() || '?'
  }

  return (
    <div className="relative" data-user-menu>
      {/* User Avatar Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (!isOpen) {
            calculateDropdownPosition()
          }
          setIsOpen(!isOpen)
        }}
        className="flex items-center gap-2 px-2 py-1.5 hover:bg-surface-hover transition-colors min-h-[44px] touch-manipulation"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar Circle */}
        <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-medium">
          {getInitials()}
        </div>
        
        {/* Name (desktop only) */}
        <span className="hidden sm:block text-sm font-medium text-text-primary max-w-24 truncate">
          {profile?.first_name || 'User'}
        </span>
        
        {/* Dropdown Arrow */}
        <ChevronDown className={cn(
          "w-4 h-4 text-text-secondary transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          "absolute right-0 w-64 bg-surface-primary border border-border-secondary rounded-lg shadow-lg z-[100] py-2",
          "sm:w-64", // Desktop width
          "w-72 sm:w-64", // Mobile gets wider dropdown
          dropdownPosition === 'bottom' ? "top-full mt-2" : "bottom-full mb-2"
        )}>
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-border-secondary">
            <p className="text-sm font-medium text-text-primary truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {user?.email}
            </p>
            {isAdmin && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-brand-100 text-brand-800 text-xs rounded-full">
                Admin
              </span>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleDashboardClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors min-h-[44px] touch-manipulation"
            >
              <Home className="w-4 h-4" />
              {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </button>
            
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors min-h-[44px] touch-manipulation"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-border-secondary pt-1">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors min-h-[44px] touch-manipulation"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Mobile menu component
const MobileMenu: React.FC<{
  isOpen: boolean
  onClose: () => void
  user: any
  profile: any
  onLogout: () => void
}> = ({ isOpen, onClose, user, profile, onLogout }) => {
  const router = useRouter()
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'

  const handleNavigation = (href: string) => {
    router.push(href)
    onClose()
  }

  const handleLogout = async () => {
    onClose()
    await onLogout()
  }

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
        onClick={onClose}
      />
      
      {/* Slide-in Menu */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-surface-primary shadow-xl transform transition-transform duration-300 lg:hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-secondary">
          <Link href="/" className="font-medium text-lg text-text-primary tracking-tight">
            LOVE 4 DETAILING
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Menu Content */}
        <div className="flex flex-col h-full">
          {/* User Section (if authenticated) */}
          {user && profile && (
            <div className="p-4 border-b border-border-secondary">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-medium">
                  {profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {profile?.first_name} {profile?.last_name}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            {user ? (
              // Authenticated Navigation
              <>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation(isAdmin ? '/admin' : '/dashboard')}
                  className="w-full justify-start gap-3 min-h-[48px]"
                >
                  <Home className="w-5 h-5" />
                  {isAdmin ? 'Admin Dashboard' : 'Dashboard'}
                </Button>
                
                
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation(isAdmin ? '/admin/settings' : '/dashboard/settings')}
                  className="w-full justify-start gap-3 min-h-[48px]"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Button>
              </>
            ) : (
              // Unauthenticated Navigation
              <>
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation('/#services')}
                  className="w-full justify-start min-h-[48px]"
                >
                  Services
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation('/#about')}
                  className="w-full justify-start min-h-[48px]"
                >
                  About
                </Button>
                
                <Button
                  variant="primary"
                  onClick={() => handleNavigation('/book')}
                  className="w-full justify-start min-h-[48px]"
                >
                  Book Now
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => handleNavigation('/auth/register')}
                  className="w-full justify-start min-h-[48px]"
                >
                  Create Account
                </Button>
                
                <Button
                  variant="primary"
                  onClick={() => handleNavigation('/auth/login')}
                  className="w-full justify-start min-h-[48px]"
                >
                  Login
                </Button>
              </>
            )}
          </nav>

          {/* Logout Button (if authenticated) */}
          {user && (
            <div className="p-4 border-t border-border-secondary">
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-3 min-h-[48px] text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Main MinimalHeader component
export const MinimalHeader: React.FC<MinimalHeaderProps> = ({ className, showMobileMenu = true }) => {
  const { user, profile, isLoading, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isAuthPage = pathname.startsWith('/auth/')

  // Don't show auth pages to authenticated users
  const shouldRedirect = user && isAuthPage
  useEffect(() => {
    if (shouldRedirect) {
      router.push(isAdmin ? '/admin' : '/dashboard')
    }
  }, [shouldRedirect, isAdmin, router])

  const handleLogout = async () => {
    try {
      await logout()
      // Logout method handles redirect
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <>
      <header className={cn(
        "sticky top-0 z-40 w-full bg-surface-primary/95 backdrop-blur-sm border-b border-border-secondary",
        className
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Left Section - Logo */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button - Only show if showMobileMenu is true */}
              {showMobileMenu && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden min-h-[40px] min-w-[40px]"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              )}
              
              {/* Brand Text */}
              <Link 
                href="/" 
                className="font-medium text-lg text-text-primary hover:text-brand-600 transition-colors tracking-tight"
              >
                LOVE 4 DETAILING
              </Link>
            </div>

            {/* Right Section - Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {!isLoading && (
                <>
                  {user ? (
                    // Authenticated Navigation
                    <>
                      <Link
                        href={isAdmin ? '/admin' : '/dashboard'}
                        className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                      >
                        Dashboard
                      </Link>
                      
                      
                      <UserMenu user={user} profile={profile} onLogout={handleLogout} />
                    </>
                  ) : (
                    // Unauthenticated Navigation
                    <>
                      <Link
                        href="/#services"
                        className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                      >
                        Services
                      </Link>
                      
                      <Link
                        href="/#about"
                        className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
                      >
                        About
                      </Link>
                      
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push('/auth/register')}
                        >
                          Create Account
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => router.push('/auth/login')}
                        >
                          Login
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
              
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center gap-4">
                  <div className="w-16 h-4 bg-surface-secondary animate-pulse rounded" />
                  <div className="w-20 h-8 bg-surface-secondary animate-pulse rounded" />
                </div>
              )}
            </nav>

            {/* Mobile User Menu */}
            <div className="lg:hidden">
              {!isLoading && user && (
                <UserMenu user={user} profile={profile} onLogout={handleLogout} />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu - Only render if showMobileMenu is true */}
      {showMobileMenu && (
        <MobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          user={user}
          profile={profile}
          onLogout={handleLogout}
        />
      )}
    </>
  )
}

export default MinimalHeader