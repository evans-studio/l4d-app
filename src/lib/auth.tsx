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
  role: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      // Add timeout to profile fetch
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      )

      const { data, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as { data: UserProfile | null; error: unknown }

      if (error) {
        console.error('Error fetching profile:', error)
        // Create a default profile if fetch fails
        setProfile({
          id: userId,
          email: '',
          role: 'customer',
          first_name: 'User'
        })
      } else {
        setProfile(data)
      }
    } catch (error: unknown) {
      console.error('Profile fetch error:', error)
      // Create a default profile on error
      setProfile({
        id: userId,
        email: '',
        role: 'customer',
        first_name: 'User'
      })
    }
  }

  const signOut = async () => {
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
        console.log('Getting initial session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Initial session result:', { hasSession: !!session, hasUser: !!session?.user, userEmail: session?.user?.email })
        
        setUser(session?.user ?? null)
        if (session?.user) {
          console.log('Initial session: Fetching profile for user:', session.user.email)
          await fetchProfile(session.user.id)
          console.log('Initial session: Profile fetch completed')
        } else {
          console.log('Initial session: No user found')
        }
      } catch (error) {
        console.error('Initial session error:', error)
      } finally {
        console.log('Initial session: Setting isLoading to false')
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', { event, hasSession: !!session, hasUser: !!session?.user, userEmail: session?.user?.email })
        
        setUser(session?.user ?? null)
        setProfile(null)
        
        if (session?.user) {
          console.log('Fetching profile for user:', session.user.email)
          await fetchProfile(session.user.id)
          console.log('Profile fetch completed')
        } else {
          console.log('No user in session, skipping profile fetch')
        }
        
        console.log('Setting isLoading to false')
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