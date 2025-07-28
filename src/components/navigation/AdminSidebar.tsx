'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth'
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

interface AdminSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuth()

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
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
      // Still redirect even if signOut fails
      router.push('/')
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-6 border-b border-[var(--border-secondary)]">
            <Image
              src="/logo.png"
              alt="Love 4 Detailing"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                Love 4 Detailing
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Admin Portal
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-4 border-b border-[var(--border-secondary)]">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Quick Actions
            </p>
            <div className="space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                
                return (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="flex items-center gap-3 px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
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
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
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
                      ? 'bg-[var(--primary)] text-white shadow-lg' 
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
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
                        ${isActive ? 'text-white text-opacity-80' : 'text-[var(--text-muted)]'}
                      `}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  
                  {item.badge && (
                    <div className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${item.badge.type === 'pending' 
                        ? 'bg-[var(--warning-bg)] text-[var(--warning)]' 
                        : 'bg-[var(--info-bg)] text-[var(--info)]'
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
          <div className="px-4 py-6 border-t border-[var(--border-secondary)] space-y-2">
            <Link
              href="/admin/help"
              className="flex items-center gap-3 px-3 py-3 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
            >
              <HelpCircleIcon className="w-5 h-5" />
              <div>
                <p className="text-sm font-medium">Help & Support</p>
                <p className="text-xs text-[var(--text-muted)]">Get assistance</p>
              </div>
            </Link>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
            >
              <LogOutIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] transform transition-transform duration-300 ease-in-out lg:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-secondary)]">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Love 4 Detailing"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Love 4 Detailing
                </h2>
                <p className="text-xs text-[var(--text-secondary)]">
                  Admin Portal
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Quick Actions */}
          <div className="px-4 py-4 border-b border-[var(--border-secondary)]">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
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
                    className="flex items-center gap-3 px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
                  >
                    <Icon className={`w-4 h-4 ${action.color}`} />
                    <span className="text-sm">{action.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
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
                    group flex items-center justify-between px-3 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-[var(--primary)] text-white shadow-lg' 
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
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
                        ${isActive ? 'text-white text-opacity-80' : 'text-[var(--text-muted)]'}
                      `}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  
                  {item.badge && (
                    <div className={`
                      px-2 py-1 text-xs font-medium rounded-full
                      ${item.badge.type === 'pending' 
                        ? 'bg-[var(--warning-bg)] text-[var(--warning)]' 
                        : 'bg-[var(--info-bg)] text-[var(--info)]'
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
          <div className="px-4 py-6 border-t border-[var(--border-secondary)] space-y-2">
            <Link
              href="/admin/help"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-3 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
            >
              <HelpCircleIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Help & Support</span>
            </Link>
            
            <button
              onClick={() => {
                handleLogout()
                onClose()
              }}
              className="w-full flex items-center gap-3 px-3 py-3 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
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