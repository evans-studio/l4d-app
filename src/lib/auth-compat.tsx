'use client'

import { createContext, useContext, useEffect, useState, useMemo } from 'react'
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
  
  // Get auth state from Zustand store with stable selectors
  const user = useAuthStore((state) => state.user)
  const profile = useAuthStore((state) => state.profile)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const logout = useAuthStore((state) => state.logout)
  const refreshProfile = useAuthStore((state) => state.refreshProfile)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // Memoize the value to prevent unnecessary re-renders
  const value: LegacyAuthContextType = useMemo(() => {
    // Debug the authentication state
    const authState = !!user && !!profile
    console.log('Auth compatibility check:', { 
      user: !!user, 
      profile: !!profile, 
      isAuthenticated: authState
    })
    
    return {
      user,
      profile,
      isLoading: isHydrated ? isLoading : false,
      isAuthenticated: authState, // Calculate directly instead of relying on Zustand getter
      error,
      isAdmin: profile?.role === 'admin' || profile?.role === 'super_admin' || false,
      isCustomer: profile?.role === 'customer' || false,
      login,
      register,
      logout,
      refreshProfile,
    }
  }, [user, profile, isLoading, error, login, register, logout, refreshProfile, isHydrated])

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