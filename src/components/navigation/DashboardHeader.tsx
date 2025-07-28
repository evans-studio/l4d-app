'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/auth-enterprise'
import { Button } from '@/components/ui/primitives/Button'
import { 
  MenuIcon, 
  BellIcon, 
  UserIcon, 
  PlusIcon,
  ChevronDownIcon,
  SettingsIcon,
  LogOutIcon
} from 'lucide-react'

interface DashboardHeaderProps {
  onMenuClick: () => void
  userType: 'customer' | 'admin'
}

export function DashboardHeader({ onMenuClick, userType }: DashboardHeaderProps) {
  const router = useRouter()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      // Router push handled by logout method
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <MenuIcon className="w-6 h-6" />
          </button>

          {/* Breadcrumb could go here */}
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">
              {userType === 'customer' ? 'Customer Dashboard' : 'Admin Dashboard'}
            </h1>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {/* Quick Action Button */}
          {userType === 'customer' && (
            <Button
              onClick={() => router.push('/book')}
              size="sm"
              className="hidden sm:flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Book Service
            </Button>
          )}

          {/* Notifications */}
          <button className="relative p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <BellIcon className="w-5 h-5" />
            {/* Notification Badge */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--primary)] text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <div className="w-8 h-8 bg-[var(--primary)] rounded-full flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'User'}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {userType === 'customer' ? 'Customer' : 'Administrator'}
                </p>
              </div>
              <ChevronDownIcon className="w-4 h-4 hidden md:block" />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-lg z-50">
                <div className="py-2">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-[var(--border-secondary)]">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || 'User'}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {user?.email || ''}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        router.push('/dashboard/settings')
                        setIsUserMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <SettingsIcon className="w-4 h-4" />
                      <span className="text-sm">Account Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        handleLogout()
                        setIsUserMenuOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <LogOutIcon className="w-4 h-4" />
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {isUserMenuOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsUserMenuOpen(false)}
        />
      )}
    </header>
  )
}