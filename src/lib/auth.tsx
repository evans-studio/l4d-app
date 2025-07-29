'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  const isAuthenticated = !!user && !!profile

  const fetchProfile = async (userId: string, timeout = 10000) => {
    try {
      console.log('Fetching profile for user:', userId)
      
      // Add timeout to prevent hanging
      const fetchPromise = supabase
        .from('user_profiles')
        .select('id, email, first_name, last_name, phone, role')
        .eq('id', userId)
        .single()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), timeout)
      )

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any

      if (error) {
        console.error('Error fetching profile:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        return null
      }

      if (!data) {
        console.log('No profile data returned - profile does not exist')
        return null
      }

      console.log('Profile fetched successfully:', data)
      setProfile(data)
      return data
    } catch (error) {
      console.error('Profile fetch exception:', error)
      if (error instanceof Error && error.message === 'Profile fetch timeout') {
        console.error('Profile fetch timed out after 10 seconds - possible network or RLS issue')
      }
      return null
    }
  }

  const createProfile = async (userId: string, email: string, firstName?: string, lastName?: string, phone?: string) => {
    const role = ['zell@love4detailing.com', 'paul@evans-studio.co.uk'].includes(email.toLowerCase()) ? 'admin' : 'customer'
    
    const profileData = {
      id: userId,
      email: email.toLowerCase(),
      first_name: firstName || '',
      last_name: lastName || '',
      phone: phone || null,
      role: role,
      is_active: true
    }
    
    console.log('Creating profile with data:', profileData)
    
    // First, check if profile already exists
    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (existing) {
      console.log('Profile already exists, fetching it')
      return await fetchProfile(userId)
    }
    
    // Create new profile
    const { data, error } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single()
    
    if (error) {
      console.error('Failed to create profile:', error)
      // Try upsert as fallback
      const { data: upsertData, error: upsertError } = await supabase
        .from('user_profiles')
        .upsert(profileData)
        .select()
        .single()
      
      if (upsertError) {
        console.error('Upsert also failed:', upsertError)
        return null
      }
      
      return upsertData
    }
    
    console.log('Profile created successfully:', data)
    setProfile(data)
    return data
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
        let profile = await fetchProfile(data.user.id)
        
        // If profile doesn't exist, create it
        if (!profile) {
          profile = await createProfile(
            data.user.id,
            data.user.email!,
            data.user.user_metadata?.first_name,
            data.user.user_metadata?.last_name,
            data.user.user_metadata?.phone
          )
        }
        
        // Redirect based on role
        if (profile) {
          const redirectTo = profile.role === 'admin' ? '/admin' : '/dashboard'
          router.push(redirectTo)
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
      // 1. Create the user account
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

      // 2. Create the user profile immediately
      const profile = await createProfile(
        authData.user.id,
        email,
        firstName,
        lastName,
        phone
      )

      // 3. If email is auto-confirmed, sign them in immediately
      if (authData.user.email_confirmed_at) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (!signInError && profile) {
          setUser(authData.user)
          setProfile(profile)
          
          // Redirect immediately
          const redirectTo = profile.role === 'admin' ? '/admin' : '/dashboard'
          router.push(redirectTo)
          
          return {
            success: true,
            redirectTo
          }
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
      router.push('/')
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
          let profile = await fetchProfile(session.user.id)
          
          // Create profile if it doesn't exist
          if (!profile && session.user.email) {
            profile = await createProfile(
              session.user.id,
              session.user.email,
              session.user.user_metadata?.first_name,
              session.user.user_metadata?.last_name,
              session.user.user_metadata?.phone
            )
          }
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
          let profile = await fetchProfile(session.user.id)
          
          // Create profile if it doesn't exist
          if (!profile && session.user.email) {
            profile = await createProfile(
              session.user.id,
              session.user.email,
              session.user.user_metadata?.first_name,
              session.user.user_metadata?.last_name,
              session.user.user_metadata?.phone
            )
          }
        } else {
          setProfile(null)
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

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