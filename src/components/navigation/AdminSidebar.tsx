'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-compat'
import { 
  HomeIcon, 
  CalendarIcon, 
  ClockIcon,
  UsersIcon,
  WrenchIcon,
  BarChart3Icon,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
  XIcon,
  PlusIcon,
  AlertCircleIcon
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useAuth()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: HomeIcon,
      description: 'Overview & today\'s schedule',
      badge: null
    },
    {
      name: 'Bookings',
      href: '/admin/bookings',
      icon: CalendarIcon,
      description: 'Manage all bookings',
      badge: { count: 5, type: 'pending' as const }
    },
    {
      name: 'Schedule',
      href: '/admin/schedule',
      icon: ClockIcon,
      description: 'Time slots & calendar',
      badge: null
    },
    {
      name: 'Customers',
      href: '/admin/customers',
      icon: UsersIcon,
      description: 'Customer database',
      badge: null
    },
    {
      name: 'Services',
      href: '/admin/services',
      icon: WrenchIcon,
      description: 'Service management',
      badge: null
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: BarChart3Icon,
      description: 'Analytics & revenue',
      badge: null
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: SettingsIcon,
      description: 'Business settings',
      badge: null
    },
  ]

  const quickActions = [
    {
      name: 'Add Time Slot',
      href: '/admin/schedule/add',
      icon: PlusIcon,
      color: 'text-[var(--success)]'
    },
    {
      name: 'Pending Bookings',
      href: '/admin/bookings?status=pending',
      icon: AlertCircleIcon,
      color: 'text-[var(--warning)]'
    },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      // Router push handled by logout method
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
        <div className="flex flex-col flex-grow bg-surface-secondary border-r border-border-secondary overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-border-secondary">
            <Image
              src="/logo.png"
              alt="Love 4 Detailing"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <h2 className="text-lg font-bold text-text-primary">
                Love 4 Detailing
              </h2>
              <p className="text-xs text-text-secondary">
                Admin Portal
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-4 border-b border-border-secondary">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Quick Actions
            </p>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                
                return (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="flex items-center gap-3 px-3 py-2 text-text-secondary hover:bg-surface-hover hover:text-text-primary rounded-lg transition-colors"
                  >
                    <Icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-sm">{action.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Management
            </p>
            
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-brand-600 text-white' 
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>
                        {item.name}
                      </p>
                      <p className={`
                        text-xs mt-0.5
                        ${isActive ? 'text-white text-opacity-80' : 'text-text-muted'}
                      `}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  
                  {item.badge && (
                    <div className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${item.badge.type === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                      }
                      ${isActive ? 'bg-white bg-opacity-20 text-white' : ''}
                    `}>
                      {item.badge.count}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Help & Logout */}
          <div className="px-4 py-6 border-t border-border-secondary space-y-2">
            <Link
              href="/admin/help"
              className="flex items-center gap-3 px-3 py-3 text-text-secondary hover:bg-surface-hover hover:text-text-primary rounded-lg transition-colors"
            >
              <HelpCircleIcon className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Help & Support</p>
                <p className="text-xs text-text-muted">Get assistance</p>
              </div>
            </Link>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 text-text-secondary hover:bg-surface-hover hover:text-text-primary rounded-lg transition-colors"
            >
              <LogOutIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-surface-secondary border-r border-border-secondary shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border-secondary bg-surface-secondary">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Love 4 Detailing"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div>
                <h2 className="text-base font-bold text-text-primary">
                  Love 4 Detailing
                </h2>
                <p className="text-xs text-text-secondary">
                  Admin Portal
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-hover min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close sidebar"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Quick Actions */}
          <div className="px-4 py-4 border-b border-border-secondary">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Quick Actions
            </p>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                
                return (
                  <Link
                    key={action.name}
                    href={action.href}
                    onClick={onClose}
                    className="flex items-center gap-3 px-3 py-2.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary rounded-lg transition-colors min-h-[44px]"
                  >
                    <Icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-sm">{action.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto bg-surface-secondary">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Management
            </p>
            
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200 min-h-[44px]
                    ${isActive 
                      ? 'bg-brand-600 text-white' 
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>
                        {item.name}
                      </p>
                      <p className={`
                        text-xs mt-0.5
                        ${isActive ? 'text-white text-opacity-80' : 'text-text-muted'}
                      `}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  
                  {item.badge && (
                    <div className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${item.badge.type === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                      }
                      ${isActive ? 'bg-white bg-opacity-20 text-white' : ''}
                    `}>
                      {item.badge.count}
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Mobile Help & Logout */}
          <div className="px-4 py-4 border-t border-border-secondary space-y-2 bg-surface-secondary">
            <Link
              href="/admin/help"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 text-text-secondary hover:bg-surface-hover hover:text-text-primary rounded-lg transition-colors min-h-[44px]"
            >
              <HelpCircleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Help & Support</span>
            </Link>
            
            <button
              onClick={() => {
                handleLogout()
                onClose()
              }}
              className="w-full flex items-center gap-3 px-3 py-3 text-text-secondary hover:bg-surface-hover hover:text-text-primary rounded-lg transition-colors min-h-[44px]"
            >
              <LogOutIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}