'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  
  useEffect(() => {
    // Initialize auth on app start
    initializeAuth()
  }, [initializeAuth])

  return <>{children}</>
}

// Hook for components that need auth state
export function useAuth() {
  return useAuthStore((state) => ({
    user: state.user,
    profile: state.profile,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.isAdmin,
    isCustomer: state.isCustomer,
    error: state.error,
    login: state.login,
    register: state.register,
    logout: state.logout,
    refreshProfile: state.refreshProfile,
  }))
}