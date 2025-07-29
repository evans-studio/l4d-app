'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { User } from '@supabase/supabase-js'

// Backward compatibility interface matching the old auth context
interface LegacyAuthContextType {
  user: User | null
  profile: any | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isCustomer: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const LegacyAuthContext = createContext<LegacyAuthContextType | undefined>(undefined)

// Legacy AuthProvider that wraps the new Zustand store
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Get auth state from Zustand store
  const authState = useAuthStore((state) => ({
    user: state.user,
    profile: state.profile,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    login: state.login,
    register: state.register,
    logout: state.logout,
    refreshProfile: state.refreshProfile,
  }))

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Provide consistent initial state until hydration is complete
  const value: LegacyAuthContextType = {
    ...authState,
    // Ensure consistent state until hydrated
    isLoading: isHydrated ? authState.isLoading : false,
    isAdmin: authState.profile?.role === 'admin' || authState.profile?.role === 'super_admin' || false,
    isCustomer: authState.profile?.role === 'customer' || false,
  }

  return (
    <LegacyAuthContext.Provider value={value}>
      {children}
    </LegacyAuthContext.Provider>
  )
}

// Legacy useAuth hook for backward compatibility
export function useAuth() {
  const context = useContext(LegacyAuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}