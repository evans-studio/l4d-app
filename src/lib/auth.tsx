'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: 'admin' | 'customer'
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Admin emails that should get admin role
const ADMIN_EMAILS = [
  'zell@love4detailing.com',
  'paul@evans-studio.co.uk'
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && !!profile

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, phone, role')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      setProfile(data)
      return data
    } catch (error) {
      console.error('Profile fetch error:', error)
      return null
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      if (data.user) {
        setUser(data.user)
        await fetchProfile(data.user.id)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.'
      }
    }
  }

  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string,
    phone?: string
  ): Promise<{ success: boolean; error?: string; redirectTo?: string }> => {
    try {
      // Determine role based on email
      const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'customer'

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            role: role
          }
        }
      })

      if (error) {
        return {
          success: false,
          error: error.message
        }
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            role: role,
            is_active: true
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        // If user is confirmed (or auto-confirmed), set user state
        if (data.user.email_confirmed_at) {
          setUser(data.user)
          await fetchProfile(data.user.id)
          
          return {
            success: true,
            redirectTo: role === 'admin' ? '/admin' : '/dashboard'
          }
        }
      }

      return {
        success: true,
        error: 'Registration successful! Please check your email to verify your account.'
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error. Please try again.'
      }
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        }
      } catch (error) {
        console.error('Initial session error:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setProfile(null)
        
        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          
          // Handle role-based redirects for login events
          if (event === 'SIGNED_IN' && profile) {
            const currentPath = window.location.pathname
            
            // Only redirect if user is on auth pages
            if (currentPath.startsWith('/auth/')) {
              const redirectTo = profile.role === 'admin' ? '/admin' : '/dashboard'
              window.location.href = redirectTo
            }
          }
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
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