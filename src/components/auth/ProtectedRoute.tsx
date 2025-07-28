'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRole?: string[]
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
          window.location.href = '/auth/login'
          return
        }

        setUser(session.user)

        // Get user profile if role check is required
        if (requireRole) {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (error || !profile) {
            console.error('Failed to fetch profile:', error)
            window.location.href = '/auth/login'
            return
          }

          if (!requireRole.includes(profile.role)) {
            window.location.href = '/auth/login'
            return
          }

          setProfile(profile)
        }
      } catch (error) {
        console.error('Auth check error:', error)
        window.location.href = '/auth/login'
        return
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [requireRole])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  if (requireRole && !profile) {
    return null // Will redirect
  }

  return <>{children}</>
}

// Convenience components
export function CustomerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireRole={['customer', 'admin', 'super_admin']}>
      {children}
    </ProtectedRoute>
  )
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requireRole={['admin', 'super_admin']}>
      {children}
    </ProtectedRoute>
  )
}