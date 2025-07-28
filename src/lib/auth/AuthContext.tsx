'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = async () => {
    if (!user) {
      console.log('No user available for profile refresh')
      return
    }

    try {
      console.log('Fetching profile for user:', user.id)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('Profile not found, user may need profile creation')
        }
      } else {
        console.log('Profile fetched successfully:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('Profile fetch error:', error)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      
      // Clear all Supabase cookies manually
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const cookieParts = cookie.split('=')
        const name = cookieParts[0]?.trim()
        if (name && name.includes('sb-vwejbgfiddltdqwhfjmt')) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        }
      })
      
      // Force redirect to login
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  useEffect(() => {
    // Get initial session with retry logic
    const getInitialSession = async (retryCount = 0) => {
      let shouldStopLoading = false
      
      try {
        console.log('Getting initial session... (attempt', retryCount + 1, ')')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          shouldStopLoading = true
        } else if (session?.user) {
          console.log('Initial session found for user:', session.user.id, 'with access token:', !!session.access_token)
          setUser(session.user)
          shouldStopLoading = true
        } else {
          console.log('No initial session found - checking cookies manually...')
          // Check if there are auth cookies present
          const cookies = document.cookie
          const hasAuthCookies = cookies.includes('sb-vwejbgfiddltdqwhfjmt')
          console.log('Has auth cookies:', hasAuthCookies)
          
          if (hasAuthCookies && retryCount < 3) {
            console.log('Auth cookies found but no session - retrying in 200ms... (attempt', retryCount + 1, 'of 3)')
            setTimeout(() => getInitialSession(retryCount + 1), 200)
            return // Don't set loading to false yet
          } else if (hasAuthCookies && retryCount >= 3) {
            console.log('Max retries reached - session loading failed despite cookies')
            shouldStopLoading = true
          } else {
            // No cookies, no session - definitely done loading
            shouldStopLoading = true
          }
        }
      } catch (error) {
        console.error('Initial session error:', error)
        shouldStopLoading = true
      } finally {
        if (shouldStopLoading) {
          setIsLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setProfile(null) // Reset profile when user changes
        setIsLoading(false)

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Refresh profile when signed in
          if (session?.user) {
            // Small delay to ensure user is set
            setTimeout(() => {
              refreshProfile()
            }, 100)
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Refresh profile when user changes
  useEffect(() => {
    if (user && !profile) {
      refreshProfile()
    }
  }, [user])

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}