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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && !!profile
  
  // Debug logging
  console.log('Auth State:', { 
    user: !!user, 
    userEmail: user?.email, 
    profile: !!profile, 
    profileRole: profile?.role,
    isAuthenticated,
    isLoading 
  })

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      
      // First try regular query
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, phone, role')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        console.error('Profile fetch error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Log common error scenarios
        if (error.code === 'PGRST116') {
          console.log('PGRST116: No rows returned - profile does not exist')
        } else if (error.message.includes('permission') || error.message.includes('RLS')) {
          console.log('Permission error detected, this indicates RLS policy issue')
          console.log('Please run the fix-profile-access.sql script in your Supabase dashboard')
        } else if (error.message.includes('JWT')) {
          console.log('JWT error - authentication token might be invalid')
        }
        
        return null
      }

      if (!data) {
        console.error('No profile data returned for user:', userId)
        return null
      }

      console.log('Profile fetched successfully:', data)
      setProfile(data)
      return data
    } catch (error) {
      console.error('Profile fetch exception:', error)
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
        const profile = await fetchProfile(data.user.id)
        
        // If profile doesn't exist, create it
        if (!profile) {
          const role = ['zell@love4detailing.com', 'paul@evans-studio.co.uk'].includes(email.toLowerCase()) ? 'admin' : 'customer'
          
          const { error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: data.user.id,
              email: email,
              first_name: data.user.user_metadata?.first_name || '',
              last_name: data.user.user_metadata?.last_name || '',
              phone: data.user.user_metadata?.phone || null,
              role: role,
              is_active: true
            })
          
          if (!createError) {
            await fetchProfile(data.user.id)
          }
        }
      }

      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
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
      // Use client-side registration to establish session immediately
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || ''
          }
        }
      })

      if (authError) {
        return {
          success: false,
          error: authError.message
        }
      }

      if (!authData.user) {
        return {
          success: false,
          error: 'Registration failed. Please try again.'
        }
      }

      // Determine role based on email
      const role = ['zell@love4detailing.com', 'paul@evans-studio.co.uk'].includes(email.toLowerCase()) ? 'admin' : 'customer'

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          role: role,
          is_active: true
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Continue anyway - profile might already exist
      }

      // If user is confirmed immediately (auto-confirm enabled)
      if (authData.user.email_confirmed_at) {
        setUser(authData.user)
        await fetchProfile(authData.user.id)
        
        return {
          success: true,
          redirectTo: role === 'admin' ? '/admin' : '/dashboard'
        }
      }

      // Email confirmation required
      return {
        success: true,
        error: 'Registration successful! Please check your email to verify your account.'
      }
    } catch (error) {
      console.error('Registration error:', error)
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
        console.log('Auth state change:', event, !!session?.user)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Don't clear profile immediately to avoid auth state flickering
          let profile = await fetchProfile(session.user.id)
          
          // If profile doesn't exist, create it
          if (!profile) {
            console.log('Profile not found, creating new profile for user:', session.user.id)
            console.log('User metadata:', session.user.user_metadata)
            console.log('User email:', session.user.email)
            
            const role = ['zell@love4detailing.com', 'paul@evans-studio.co.uk'].includes(session.user.email?.toLowerCase() || '') ? 'admin' : 'customer'
            
            const profileData = {
              id: session.user.id,
              email: session.user.email || '',
              first_name: session.user.user_metadata?.first_name || session.user.user_metadata?.firstName || '',
              last_name: session.user.user_metadata?.last_name || session.user.user_metadata?.lastName || '',
              phone: session.user.user_metadata?.phone || null,
              role: role,
              is_active: true
            }
            
            console.log('Creating profile with data:', profileData)
            
            const { data: createdProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert(profileData)
              .select()
              .single()
            
            if (createError) {
              console.error('Failed to create profile:', createError)
              console.error('Create error details:', {
                message: createError.message,
                details: createError.details,
                hint: createError.hint,
                code: createError.code
              })
            } else {
              console.log('Profile created successfully:', createdProfile)
              profile = await fetchProfile(session.user.id)
            }
          }
          
          // Handle role-based redirects for login events
          if (event === 'SIGNED_IN' && profile) {
            const currentPath = window.location.pathname
            
            // Only redirect if user is on auth pages
            if (currentPath.startsWith('/auth/')) {
              const redirectTo = profile.role === 'admin' ? '/admin' : '/dashboard'
              window.location.href = redirectTo
            }
          }
        } else {
          // Only clear profile if there's no user
          setProfile(null)
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