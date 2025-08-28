'use client'

import { useAuth } from '@/lib/auth-compat'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = ['customer', 'admin', 'super_admin'],
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { user, profile, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  // Derive a stable view of auth readiness
  const hasUser = !!user
  const hasRole = !!profile?.role
  const role = profile?.role as string | undefined

  useEffect(() => {
    if (isLoading) return

    // If no user at all, redirect to login and preserve destination
    if (!hasUser) {
      const current = typeof window !== 'undefined' ? (window.location.pathname + window.location.search) : '/'
      const dest = `${redirectTo}?redirect=${encodeURIComponent(current)}`
      router.push(dest)
      return
    }

    // Only enforce roles when we actually know the role
    if (hasRole && role && !allowedRoles.includes(role)) {
      const userRedirectTo = (role === 'admin' || role === 'super_admin') ? '/admin' : '/dashboard'
      router.push(userRedirectTo)
      return
    }
  }, [isLoading, hasUser, hasRole, role, router, allowedRoles, redirectTo])

  // While loading, or while we have a user but the role/profile hasn't loaded yet, show a spinner
  if (isLoading || (hasUser && !hasRole)) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // If after checks we still don't have auth or role is not allowed, block render
  if (!isAuthenticated || (role && !allowedRoles.includes(role))) {
    return null
  }

  return <>{children}</>
}

export function CustomerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['customer']}>
      {children}
    </ProtectedRoute>
  )
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
      {children}
    </ProtectedRoute>
  )
}