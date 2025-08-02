'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings,
  BarChart3,
  Wrench,
  Menu,
  X,
  Plus
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      {/* Global Header - No mobile menu hamburger since sidebar handles navigation */}
      <MinimalHeader showMobileMenu={false} />
      
      <div className="flex flex-1">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-surface-secondary border-r border-border-secondary shadow-xl transform transition-transform duration-300 ease-in-out lg:transform-none lg:static lg:shadow-none lg:flex-shrink-0",
          "top-16 lg:top-0", // Account for header height on mobile only
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-secondary lg:hidden">
              <span className="font-medium text-lg text-text-primary">Admin Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="min-h-[44px] min-w-[44px]"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

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
                    onClick={() => setSidebarOpen(false)}
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

            {/* Footer Actions - can be used for other actions if needed */}
            <div className="p-4 border-t border-border-secondary">
              {/* Future admin actions can go here */}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Mobile Menu Button */}
          <div className="lg:hidden bg-surface-primary border-b border-border-secondary px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              leftIcon={<Menu className="w-4 h-4" />}
              className="text-text-secondary hover:text-text-primary"
            >
              Admin Menu
            </Button>
          </div>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 pb-20 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* PWA Bottom Navigation - Fixed to screen bottom for easy thumb access */}
      <div className="lg:hidden bg-surface-secondary/95 backdrop-blur-md border-t border-border-secondary/50 fixed bottom-0 left-0 right-0 z-50">
        <div className="safe-area-inset-bottom">
          <div className="flex items-center justify-around py-1">
            {/* First 4 navigation items */}
            {navigationItems.slice(0, 4).map((item) => {
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
            
            {/* Enhanced Schedule Button - Center Position */}
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
              <span className="text-[10px] leading-tight font-medium mt-1">
                Schedule
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}