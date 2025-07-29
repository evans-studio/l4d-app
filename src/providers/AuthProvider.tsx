'use client'

import { useEffect } from 'react'
import { useAuthStore as useStore } from '@/stores/authStore'

export function ZustandAuthInitializer({ children }: { children: React.ReactNode }) {
  const initializeAuth = useStore((state) => state.initializeAuth)
  
  useEffect(() => {
    // Initialize auth on app start
    initializeAuth()
  }, [initializeAuth])

  return <>{children}</>
}

// New hook for components migrated to Zustand
export function useAuth() {
  return useStore((state) => ({
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