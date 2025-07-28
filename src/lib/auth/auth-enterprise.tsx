'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  role: string
  isActive?: boolean
}

interface SessionInfo {
  id: string
  expiresAt: string
}

interface AuthContextType {
  user: UserProfile | null
  session: SessionInfo | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function EnterpriseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Calculate authentication status
  const isAuthenticated = !!user && !!session

  /**
   * Login function using enterprise auth
   */
  const login = useCallback(async (
    email: string, 
    password: string, 
    rememberMe: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch('/api/auth/enterprise/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
        credentials: 'include' // Important for cookies
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.error?.message || 'Login failed'
        }
      }

      // Update state with user and session info
      setUser(data.data.user)
      setSession(data.data.session)

      return { success: true }

    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Network error. Please try again.'
      }
    }
  }, [])

  /**
   * Logout function
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/enterprise/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Always clear local state
      setUser(null)
      setSession(null)
      
      // Redirect to home
      window.location.href = '/'
    }
  }, [])

  /**
   * Refresh authentication state
   */
  const refreshAuth = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/enterprise/validate', {
        method: 'GET',
        credentials: 'include'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.data.user)
        setSession(data.data.session)
      } else {
        setUser(null)
        setSession(null)
      }
    } catch (error) {
      console.error('Auth refresh error:', error)
      setUser(null)
      setSession(null)
    }
  }, [])

  /**
   * Initialize authentication state
   */
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      await refreshAuth()
      setIsLoading(false)
    }

    initAuth()
  }, [refreshAuth])

  /**
   * Set up periodic token refresh
   */
  useEffect(() => {
    if (!isAuthenticated) return

    // Refresh tokens every 10 minutes
    const refreshInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/auth/enterprise/refresh', {
          method: 'POST',
          credentials: 'include'
        })

        const data = await response.json()

        if (response.ok && data.success) {
          // Update session info if needed
          setSession(data.data.session)
        } else {
          // Refresh failed, logout user
          console.log('Token refresh failed, logging out')
          await logout()
        }
      } catch (error) {
        console.error('Background token refresh error:', error)
      }
    }, 10 * 60 * 1000) // 10 minutes

    return () => clearInterval(refreshInterval)
  }, [isAuthenticated, logout])

  /**
   * Handle session expiry
   */
  useEffect(() => {
    if (!session?.expiresAt) return undefined

    const expiryTime = new Date(session.expiresAt).getTime()
    const now = Date.now()
    const timeUntilExpiry = expiryTime - now

    // If session expires in less than 1 minute, refresh immediately
    if (timeUntilExpiry < 60 * 1000 && timeUntilExpiry > 0) {
      refreshAuth()
      return undefined
    }

    // Set timeout to refresh before expiry
    if (timeUntilExpiry > 0) {
      const refreshTimeout = setTimeout(() => {
        refreshAuth()
      }, Math.max(timeUntilExpiry - 5 * 60 * 1000, 0)) // Refresh 5 minutes before expiry

      return () => clearTimeout(refreshTimeout)
    }

    return undefined
  }, [session?.expiresAt, refreshAuth])

  /**
   * Handle visibility change to refresh auth when tab becomes visible
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated) {
        // Tab became visible, refresh auth state
        refreshAuth()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isAuthenticated, refreshAuth])

  // Add refreshProfile as an alias to refreshAuth for backward compatibility
  const refreshProfile = refreshAuth

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshAuth,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useEnterpriseAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useEnterpriseAuth must be used within an EnterpriseAuthProvider')
  }
  return context
}

// Export as useAuth for backward compatibility
export const useAuth = useEnterpriseAuth