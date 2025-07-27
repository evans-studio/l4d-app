'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Container } from '@/components/layout/templates/PageLayout'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('customer' | 'admin' | 'super_admin')[]
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = ['customer', 'admin', 'super_admin'],
  redirectTo = '/auth/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, profile } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (profile && !allowedRoles.includes(profile.role)) {
        // Redirect based on user role
        if (profile.role === 'admin' || profile.role === 'super_admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
        return
      }
    }
  }, [isAuthenticated, isLoading, profile, router, allowedRoles, redirectTo])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <Container>
          <div className="text-center space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-text-secondary">Loading...</p>
          </div>
        </Container>
      </div>
    )
  }

  // Don't render anything while redirecting
  if (!isAuthenticated || (profile && !allowedRoles.includes(profile.role))) {
    return null
  }

  return <>{children}</>
}

// Convenience components for specific roles
export function CustomerRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['customer', 'admin', 'super_admin']}>
      {children}
    </ProtectedRoute>
  )
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'super_admin']} redirectTo="/dashboard">
      {children}
    </ProtectedRoute>
  )
}