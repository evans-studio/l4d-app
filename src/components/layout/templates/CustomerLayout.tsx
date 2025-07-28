'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-enterprise';
import { 
  LayoutDashboard, 
  Calendar, 
  Car, 
  MapPin, 
  User, 
  Plus,
  Menu,
  X,
  LogOut,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/primitives/Button';
import { ResponsiveLogo } from '@/components/ui/primitives/Logo';
import { Container } from '@/components/layout/templates/PageLayout';
import { cn } from '@/lib/utils';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'My Bookings',
    href: '/dashboard/bookings',
    icon: Calendar
  },
  {
    name: 'Book Service',
    href: '/book',
    icon: Plus
  },
  {
    name: 'My Vehicles',
    href: '/dashboard/vehicles',
    icon: Car
  },
  {
    name: 'My Addresses',
    href: '/dashboard/addresses',
    icon: MapPin
  },
  {
    name: 'Account Settings',
    href: '/dashboard/settings',
    icon: Settings
  }
];

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Router push handled by logout method
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-surface-primary">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-surface-secondary border-r border-border-secondary transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-border-secondary">
            <ResponsiveLogo href="/dashboard" className="text-brand-400" />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                (item.href !== '/dashboard' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-600 text-white"
                      : "text-text-secondary hover:text-text-primary hover:bg-surface-primary"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t border-border-secondary">
            <Button
              variant="ghost"
              className="w-full justify-start text-text-secondary hover:text-error-400"
              leftIcon={<LogOut className="w-5 h-5" />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-surface-primary/95 backdrop-blur-sm border-b border-border-secondary">
          <Container>
            <div className="flex items-center justify-between py-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              <div className="flex items-center gap-4">
                <Button
                  variant="primary"
                  onClick={() => router.push('/book')}
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="hidden sm:flex"
                >
                  Book Service
                </Button>
                <Button
                  variant="primary"
                  size="icon"
                  onClick={() => router.push('/book')}
                  className="sm:hidden"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Container>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;