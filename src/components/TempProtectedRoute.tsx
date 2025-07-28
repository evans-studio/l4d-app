'use client'

import { useAuth } from '@/lib/auth'
import { useEffect } from 'react'

export function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href = '/auth/login'
    }
  }, [user, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!user) {
    return null
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