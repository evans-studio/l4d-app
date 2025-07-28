'use client'

import { useAuth } from '@/lib/auth'
import { useEffect } from 'react'

export function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    // Add a delay to prevent race conditions with login redirects
    const redirectTimer = setTimeout(() => {
      if (!isLoading && !user) {
        console.log('CustomerRoute: No user found, redirecting to login')
        window.location.href = '/auth/login'
      }
    }, 1000) // Wait 1 second to allow auth state to update

    return () => clearTimeout(redirectTimer)
  }, [user, isLoading])

  // Show loading for longer to allow auth state to stabilize
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Don't immediately redirect - let the useEffect handle it with delay
  if (!user) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return <>{children}</>
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        window.location.href = '/auth/login'
      } else if (profile && !['admin', 'super_admin'].includes(profile.role)) {
        window.location.href = '/dashboard'
      }
    }
  }, [user, isLoading, profile])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user || !profile || !['admin', 'super_admin'].includes(profile.role)) {
    return null
  }

  return <>{children}</>
}