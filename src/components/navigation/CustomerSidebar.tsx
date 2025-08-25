'use client'

import { useRouter, usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  CalendarIcon, 
  PlusCircleIcon,
  CarIcon,
  MapPinIcon,
  UserIcon,
  HelpCircleIcon,
  LogOutIcon,
  XIcon
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

interface CustomerSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function CustomerSidebar({ isOpen, onClose }: CustomerSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      description: 'Overview & upcoming bookings'
    },
    {
      name: 'My Bookings',
      href: '/dashboard/bookings',
      icon: CalendarIcon,
      description: 'View all your bookings'
    },
    {
      name: 'Book Service',
      href: '/book',
      icon: PlusCircleIcon,
      description: 'Schedule a new service',
      highlight: true
    },
    {
      name: 'My Vehicles',
      href: '/dashboard/vehicles',
      icon: CarIcon,
      description: 'Manage your vehicles'
    },
    {
      name: 'My Addresses',
      href: '/dashboard/addresses',
      icon: MapPinIcon,
      description: 'Manage service locations'
    },
    {
      name: 'Help & Support',
      href: '/dashboard/support',
      icon: HelpCircleIcon,
      description: 'Get help and contact us'
    },
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
        <div className="flex flex-col flex-grow bg-[var(--bg-secondary)] border-r border-[var(--border-primary)] overflow-y-auto overflow-x-hidden">
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
                Customer Portal
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-[var(--primary)] text-white shadow-lg' 
                      : item.highlight
                        ? 'bg-[var(--primary-light)] bg-opacity-10 text-[var(--primary)] border border-[var(--primary)] border-opacity-20'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  <Icon className={`
                    w-5 h-5 mt-0.5 flex-shrink-0
                    ${isActive ? 'text-white' : item.highlight ? 'text-[var(--primary)]' : ''}
                  `} />
                  <div className="flex-1 min-w-0">
                    <p className={`
                      text-sm font-medium
                      ${isActive ? 'text-white' : ''}
                    `}>
                      {item.name}
                    </p>
                    <p className={`
                      text-xs mt-0.5
                      ${isActive 
                        ? 'text-white text-opacity-80' 
                        : item.highlight
                          ? 'text-[var(--primary)] text-opacity-80'
                          : 'text-[var(--text-muted)]'
                      }
                    `}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* User Actions */}
          <div className="px-4 py-6 border-t border-[var(--border-secondary)]">
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
                  Customer Portal
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

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    group flex items-start gap-3 px-3 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-[var(--primary)] text-white shadow-lg' 
                      : item.highlight
                        ? 'bg-[var(--primary-light)] bg-opacity-10 text-[var(--primary)] border border-[var(--primary)] border-opacity-20'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  <Icon className={`
                    w-5 h-5 mt-0.5 flex-shrink-0
                    ${isActive ? 'text-white' : item.highlight ? 'text-[var(--primary)]' : ''}
                  `} />
                  <div className="flex-1 min-w-0">
                    <p className={`
                      text-sm font-medium
                      ${isActive ? 'text-white' : ''}
                    `}>
                      {item.name}
                    </p>
                    <p className={`
                      text-xs mt-0.5
                      ${isActive 
                        ? 'text-white text-opacity-80' 
                        : item.highlight
                          ? 'text-[var(--primary)] text-opacity-80'
                          : 'text-[var(--text-muted)]'
                      }
                    `}>
                      {item.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </nav>

          {/* Mobile User Actions */}
          <div className="px-4 py-6 border-t border-[var(--border-secondary)]">
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