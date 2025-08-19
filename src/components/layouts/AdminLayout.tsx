'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings,
  BarChart3,
  Wrench,
  Plus,
  CalendarClock,
  MoreHorizontal,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/primitives/Button'
import { MinimalHeader } from '@/components/navigation/MinimalHeader'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: React.ReactNode
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Bookings',
    href: '/admin/bookings',
    icon: Calendar,
  },
  {
    name: 'Reschedule Requests',
    href: '/admin/reschedule-requests',
    icon: CalendarClock,
  },
  {
    name: 'Schedule',
    href: '/admin/schedule',
    icon: Calendar,
  },
  {
    name: 'Customers',
    href: '/admin/customers',
    icon: Users,
  },
  {
    name: 'Services',
    href: '/admin/services',
    icon: Wrench,
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      {/* Global Header - PWA handles navigation on mobile */}
      <MinimalHeader showMobileMenu={false} />
      
      <div className="flex flex-1">

        {/* Desktop Sidebar Only */}
        <div className="hidden lg:flex lg:flex-shrink-0 lg:w-64 lg:bg-surface-secondary lg:border-r lg:border-border-secondary">
          <div className="flex flex-col h-full">

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                      isActive
                        ? "bg-brand-600/10 text-brand-600 border border-brand-600/20"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-tertiary"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Quick Action - Schedule */}
            <div className="p-4 border-t border-border-secondary">
              <Link href="/admin/schedule">
                <Button
                  variant="primary"
                  fullWidth
                  className="min-h-[44px]"
                >
                  Quick Schedule
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* PWA Bottom Navigation - Fixed to screen bottom for easy thumb access */}
      <div className="lg:hidden bg-surface-secondary/95 backdrop-blur-md border-t border-border-secondary/50 fixed bottom-0 left-0 right-0 z-50">
        <div className="safe-area-inset-bottom">
          <div className="flex items-center justify-around py-1">
            {/* First 2 navigation items */}
            {navigationItems.slice(0, 2).map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium transition-all duration-200 min-h-[56px] justify-center rounded-lg mx-1 relative overflow-hidden touch-manipulation",
                    "active:scale-95 active:bg-surface-hover/50",
                    isActive
                      ? "text-brand-600 bg-brand-600/10"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/30"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-brand-600 rounded-full" />
                  )}
                  <Icon className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive ? "scale-110" : "scale-100"
                  )} />
                  <span className="text-[10px] leading-tight font-medium">
                    {item.name}
                  </span>
                </Link>
              )
            })}
            
            {/* Enhanced Schedule Button - Center Position (no text label) */}
            <Link
              href="/admin/schedule"
              className={cn(
                "flex flex-col items-center justify-center px-2 py-2 min-h-[56px] rounded-lg mx-1 relative overflow-hidden touch-manipulation",
                "bg-brand-600 text-white shadow-lg shadow-brand-600/25 active:scale-95 active:shadow-brand-600/40 transition-all duration-200",
                pathname.startsWith('/admin/schedule') && "bg-brand-700 shadow-brand-600/40"
              )}
            >
              {/* Plus Icon with pulse animation */}
              <div className="relative w-6 h-6 flex items-center justify-center">
                <Plus className="w-6 h-6 transition-transform duration-200" />
                {/* Pulse animation for schedule button */}
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
              </div>
            </Link>
            {/* Customers and More */}
            <MobileCustomersAndMore pathname={pathname} />
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileCustomersAndMore({ pathname }: { pathname: string }) {
  const customers = navigationItems[4]!
  const CustomersIcon = customers.icon
  const isCustomers = pathname === customers.href || (customers.href !== '/admin' && pathname.startsWith(customers.href))
  const [isMoreOpen, setIsMoreOpen] = React.useState(false)

  return (
    <>
      {/* Customers link */}
      <Link
        key={customers.href}
        href={customers.href}
        className={cn(
          "flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium transition-all duration-200 min-h-[56px] justify-center rounded-lg mx-1 relative overflow-hidden touch-manipulation",
          "active:scale-95 active:bg-surface-hover/50",
          isCustomers ? "text-brand-600 bg-brand-600/10" : "text-text-secondary hover:text-text-primary hover:bg-surface-hover/30"
        )}
      >
        {isCustomers && (
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-brand-600 rounded-full" />
        )}
        <CustomersIcon className={cn("w-5 h-5 transition-transform duration-200", isCustomers ? "scale-110" : "scale-100")} />
        <span className="text-[10px] leading-tight font-medium">Customers</span>
      </Link>

      {/* More button */}
      <button
        type="button"
        onClick={() => setIsMoreOpen(true)}
        className={cn(
          "flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium transition-all duration-200 min-h-[56px] justify-center rounded-lg mx-1 relative overflow-hidden touch-manipulation",
          "active:scale-95 active:bg-surface-hover/50",
          "text-text-secondary hover:text-text-primary hover:bg-surface-hover/30"
        )}
        aria-label="More"
      >
        <MoreHorizontal className="w-5 h-5" />
        <span className="text-[10px] leading-tight font-medium">More</span>
      </button>

      {/* More sheet */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-[60]">
          {/* Overlay */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => setIsMoreOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-surface-secondary border-t border-border-secondary rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            {/* Grab handle + close */}
            <div className="max-w-md mx-auto">
              <div className="relative mb-4 h-8">
                <div className="mx-auto w-12 h-1.5 bg-border-secondary rounded-full" />
                <button
                  type="button"
                  onClick={() => setIsMoreOpen(false)}
                  aria-label="Close"
                  className="absolute right-0 top-0 inline-flex items-center justify-center w-8 h-8 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-w-md mx-auto space-y-2">
              {[
                { name: 'Reschedule Requests', href: '/admin/reschedule-requests' },
                { name: 'Services', href: '/admin/services' },
                { name: 'Analytics', href: '/admin/analytics' },
                { name: 'Settings', href: '/admin/settings' },
                { name: 'New Booking', href: '/admin/bookings/new' },
              ].map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMoreOpen(false)}
                  className="block w-full text-left px-4 py-3 rounded-lg bg-surface-primary border border-border-secondary text-text-primary active:scale-95 transition min-h-[44px]"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}