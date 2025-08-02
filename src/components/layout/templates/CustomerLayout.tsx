'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-compat';
import { 
  LayoutDashboard, 
  Calendar, 
  Car, 
  MapPin, 
  Settings,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/primitives/Button';
import { MinimalHeader } from '@/components/navigation/MinimalHeader';
import { cn } from '@/lib/utils';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'My Bookings',
    href: '/dashboard/bookings',
    icon: Calendar,
  },
  {
    name: 'My Vehicles',
    href: '/dashboard/vehicles',
    icon: Car,
  },
  {
    name: 'My Addresses',
    href: '/dashboard/addresses',
    icon: MapPin,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface-primary flex flex-col">
      {/* Global Header */}
      <MinimalHeader showMobileMenu={false} />
      
      <div className="flex flex-1">

        {/* Desktop Sidebar Only */}
        <div className="hidden lg:flex lg:flex-shrink-0 lg:w-64 lg:bg-surface-secondary lg:border-r lg:border-border-secondary">
          <div className="flex flex-col h-full">

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                      isActive
                        ? "bg-brand-600 text-white"
                        : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Quick Action - Book Service */}
            <div className="p-4 border-t border-border-secondary">
              <Link href="/book">
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="min-h-[44px]"
                >
                  Book Service
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 pb-20 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
      
      {/* PWA Bottom Navigation - Enhanced for mobile-first thumb access */}
      <div className="lg:hidden bg-surface-secondary/95 backdrop-blur-md border-t border-border-secondary/50 fixed bottom-0 left-0 right-0 z-50">
        <div className="safe-area-inset-bottom">
          <div className="flex items-center justify-around py-1">
            {/* First 2 navigation items */}
            {navigationItems.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

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
                    {item.name.replace('My ', '')}
                  </span>
                </Link>
              );
            })}
            
            {/* Enhanced Book Button - Center Position */}
            <Link
              href="/book"
              className={cn(
                "flex flex-col items-center justify-center px-2 py-2 min-h-[56px] rounded-lg mx-1 relative overflow-hidden touch-manipulation",
                "bg-brand-600 text-white shadow-lg shadow-brand-600/25 active:scale-95 active:shadow-brand-600/40 transition-all duration-200",
                pathname === '/book' && "bg-brand-700 shadow-brand-600/40"
              )}
            >
              {/* Plus Icon with pulse animation */}
              <div className="relative w-6 h-6 flex items-center justify-center">
                <Plus className="w-6 h-6 transition-transform duration-200" />
                {/* Pulse animation for book button */}
                <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
              </div>
            </Link>

            {/* Last 2 navigation items */}
            {navigationItems.slice(2, 4).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

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
                    {item.name.replace('My ', '')}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerLayout;