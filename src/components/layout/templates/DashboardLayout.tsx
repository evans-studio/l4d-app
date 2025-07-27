'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  X, 
  Home, 
  Calendar, 
  Users, 
  Settings, 
  Bell,
  Search,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/primitives/Button';
import { Badge, CountBadge } from '@/components/ui/primitives/Badge';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
  notifications?: number;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  className,
  user = { name: 'John Doe', email: 'john@example.com' },
  notifications = 3
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: true },
    { name: 'Bookings', href: '/bookings', icon: Calendar, current: false, count: 5 },
    { name: 'Customers', href: '/customers', icon: Users, current: false },
    { name: 'Settings', href: '/settings', icon: Settings, current: false },
  ];

  return (
    <div className={cn('min-h-screen bg-gray-900', className)}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-gray-600 opacity-75" />
        </div>
      )}

      {/* Mobile sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 lg:hidden',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <span className="text-xl font-bold text-white">Love4Detailing</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-8">
          <SidebarNavigation navigation={navigation} />
        </nav>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gray-800 border-r border-gray-700">
            <div className="flex items-center flex-shrink-0 px-4">
              <span className="text-xl font-bold text-white">Love4Detailing</span>
            </div>
            <nav className="mt-8 flex-grow">
              <SidebarNavigation navigation={navigation} />
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:ml-64">
        {/* Top header */}
        <div className="sticky top-0 z-30 flex h-16 bg-gray-800 border-b border-gray-700 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="px-4 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex justify-between flex-1 px-4 sm:px-6 lg:px-8">
            {/* Search */}
            <div className="flex flex-1">
              <div className="flex w-full md:ml-0">
                <div className="relative w-full max-w-md">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search..."
                    type="search"
                  />
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center ml-4 md:ml-6 space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <Bell className="w-6 h-6" />
                </button>
                {notifications > 0 && (
                  <CountBadge 
                    count={notifications} 
                    className="absolute -top-1 -right-1"
                  >
                    {notifications}
                  </CountBadge>
                )}
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center max-w-xs text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-white">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-48 bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <a
                        href="#"
                        className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </a>
                      <a
                        href="#"
                        className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign out
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

interface SidebarNavigationProps {
  navigation: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    current: boolean;
    count?: number;
  }>;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ navigation }) => {
  return (
    <div className="px-3 space-y-1">
      {navigation.map((item) => (
        <a
          key={item.name}
          href={item.href}
          className={cn(
            'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
            item.current
              ? 'bg-gray-900 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          )}
        >
          <item.icon
            className={cn(
              'mr-3 flex-shrink-0 h-6 w-6 transition-colors',
              item.current ? 'text-white' : 'text-gray-400 group-hover:text-white'
            )}
          />
          <span className="flex-1">{item.name}</span>
          {item.count && (
            <Badge variant="secondary" size="sm" className="ml-2">
              {item.count}
            </Badge>
          )}
        </a>
      ))}
    </div>
  );
};

// Dashboard content components
interface DashboardHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: Array<{
    name: string;
    href?: string;
  }>;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  title,
  description,
  action,
  breadcrumbs
}) => {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.name} className="flex items-center">
                {index > 0 && (
                  <span className="text-gray-400 mx-2">/</span>
                )}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
                  >
                    {crumb.name}
                  </a>
                ) : (
                  <span className="text-sm text-gray-200">{crumb.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-400">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

interface StatsGridProps {
  stats: Array<{
    name: string;
    value: string | number;
    change?: string;
    changeType?: 'increase' | 'decrease';
    icon?: React.ComponentType<{ className?: string }>;
  }>;
  className?: string;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, className }) => {
  return (
    <div className={cn('grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-gray-800 overflow-hidden rounded-lg border border-gray-700 p-6"
        >
          <div className="flex items-center">
            {stat.icon && (
              <div className="flex-shrink-0">
                <stat.icon className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className={cn('w-0 flex-1', stat.icon && 'ml-5')}>
              <dl>
                <dt className="text-sm font-medium text-gray-400 truncate">
                  {stat.name}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-white">
                    {stat.value}
                  </div>
                  {stat.change && (
                    <div
                      className={cn(
                        'ml-2 flex items-baseline text-sm font-semibold',
                        stat.changeType === 'increase' ? 'text-green-400' : 'text-red-400'
                      )}
                    >
                      {stat.change}
                    </div>
                  )}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Dashboard demo
export const DashboardDemo: React.FC = () => {
  const stats = [
    { 
      name: 'Total Bookings', 
      value: '124', 
      change: '+12%', 
      changeType: 'increase' as const,
      icon: Calendar 
    },
    { 
      name: 'Active Customers', 
      value: '89', 
      change: '+5%', 
      changeType: 'increase' as const,
      icon: Users 
    },
    { 
      name: 'Revenue', 
      value: '$12,450', 
      change: '+8%', 
      changeType: 'increase' as const 
    },
    { 
      name: 'Pending', 
      value: '8', 
      change: '-2%', 
      changeType: 'decrease' as const 
    },
  ];

  return (
    <DashboardLayout>
      <DashboardHeader
        title="Dashboard"
        description="Welcome back! Here's what's happening with your business."
        breadcrumbs={[
          { name: 'Home', href: '/' },
          { name: 'Dashboard' }
        ]}
        action={
          <Button variant="primary">
            New Booking
          </Button>
        }
      />
      
      <StatsGrid stats={stats} className="mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-medium text-white mb-4">Recent Bookings</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">Customer {i}</p>
                  <p className="text-xs text-gray-400">Exterior Detail - Today</p>
                </div>
                <Badge variant="success" size="sm">Confirmed</Badge>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-medium text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-2" />
              Manage Services
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};