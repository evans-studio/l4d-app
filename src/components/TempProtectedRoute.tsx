'use client'

import { useAuth } from '@/lib/auth'
import { useEffect } from 'react'

export function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  // DEBUG: Log the auth state
  console.log('CustomerRoute render:', { user: !!user, isLoading, userEmail: user?.email })

  useEffect(() => {
    // Much longer delay to prevent race conditions with login redirects
    const redirectTimer = setTimeout(() => {
      console.log('CustomerRoute: Timer fired, checking auth state:', { user: !!user, isLoading })
      if (!isLoading && !user) {
        console.log('CustomerRoute: No user found after delay, redirecting to login')
        window.location.href = '/auth/login'
      } else {
        console.log('CustomerRoute: User found or still loading, staying put')
      }
    }, 3000) // Wait 3 seconds to allow auth state to update

    return () => {
      console.log('CustomerRoute: Cleaning up timer')
      clearTimeout(redirectTimer)
    }
  }, [user, isLoading])

  // Show loading for much longer to allow auth state to stabilize
  if (isLoading) {
    console.log('CustomerRoute: Showing loading (isLoading=true)')
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
        <p className="ml-4 text-text-secondary">Loading authentication...</p>
      </div>
    )
  }

  // Show loading even if no user yet - let the timer handle redirects
  if (!user) {
    console.log('CustomerRoute: No user but not loading, showing temporary loading state')
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
        <p className="ml-4 text-text-secondary">Checking authentication...</p>
      </div>
    )
  }

  console.log('CustomerRoute: Rendering children for authenticated user')
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