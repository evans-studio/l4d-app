import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/client'
import { UserProfile, parseUserProfile } from '@/schemas/auth.schema'

// Custom storage that only works on client side
const clientOnlyStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(name, value)
    } catch {
      // Ignore errors
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(name)
    } catch {
      // Ignore errors
    }
  }
}

interface AuthState {
  // State
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Auth operations
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>
  logout: () => Promise<{ success: boolean; error?: string }>
  
  // Profile operations
  fetchProfile: (userId: string) => Promise<UserProfile | null>
  createProfile: (userId: string, email: string, firstName?: string, lastName?: string, phone?: string) => Promise<UserProfile | null>
  refreshProfile: () => Promise<void>
  
  // Session management
  initializeAuth: () => Promise<void>
  checkAuthState: () => Promise<void>
}

const ADMIN_EMAILS = ['zell@love4detailing.com', 'paul@evans-studio.co.uk']

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state - consistent between server and client
      user: null,
      profile: null,
      isLoading: false, // Start with false to prevent hydration mismatch
      error: null,
      
      // Remove computed getters - they don't work properly in production
      // These will be computed in the compatibility layer instead
      
      // State setters
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => {
        console.log('🔄 Auth loading state changed:', isLoading)
        set({ isLoading })
      },
      setError: (error) => {
        console.log('🚨 Auth error state changed:', error)
        set({ error })
      },
      
      // Profile operations
      fetchProfile: async (userId: string) => {
        try {
          console.log('🔵 Fetching profile for user via API:', userId)
          
          const response = await fetch(`/api/auth/profile?userId=${userId}`, {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          })
          
          console.log('🔵 Profile API response status:', response.status)
          
          const result = await response.json()
          
          if (!result.success) {
            console.error('🔴 Profile fetch API error:', result.error)
            
            if (result.error.code === 'PROFILE_NOT_FOUND') {
              console.log('🟡 Profile not found, will need to create one')
              set({ error: null }) // Don't set this as an error
              return null
            }
            
            set({ error: result.error.message })
            return null
          }

          console.log('🟢 Profile fetched successfully via API:', result.data)
          set({ profile: result.data, error: null })
          return result.data
        } catch (error) {
          console.error('🔴 Profile fetch exception:', error)
          set({ error: 'Network error while fetching profile' })
          return null
        }
      },
      
      createProfile: async (userId: string, email: string, firstName?: string, lastName?: string, phone?: string) => {
        try {
          console.log('Creating profile via API:', { userId, email, firstName, lastName, phone })
          
          const response = await fetch('/api/auth/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, email, firstName, lastName, phone })
          })
          
          const result = await response.json()
          
          if (!result.success) {
            console.error('Profile creation API error:', result.error)
            set({ error: result.error.message })
            return null
          }
          
          console.log('Profile created successfully via API:', result.data)
          set({ profile: result.data })
          return result.data
        } catch (error) {
          console.error('Profile creation exception:', error)
          set({ error: 'Network error while creating profile' })
          return null
        }
      },
      
      refreshProfile: async () => {
        const { user, fetchProfile } = get()
        if (user) {
          await fetchProfile(user.id)
        }
      },
      
      // Auth operations
      login: async (email: string, password: string) => {
        try {
          console.log('🔵 Starting login process for:', email)
          set({ isLoading: true, error: null })
          
          // Add timeout to prevent hanging
          const loginPromise = supabase.auth.signInWithPassword({
            email,
            password
          })
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Login timeout')), 30000)
          )
          
          const { data, error } = await Promise.race([loginPromise, timeoutPromise]) as any

          if (error) {
            console.error('🔴 Auth login error:', error)
            set({ isLoading: false, error: error.message })
            return { success: false, error: error.message }
          }

          if (data.user) {
            console.log('🟢 Login successful, setting user:', data.user.id, data.user.email)
            set({ user: data.user })
            
            // Fetch or create profile with timeout
            console.log('🔵 Fetching profile for user:', data.user.id)
            
            try {
              let profile = await Promise.race([
                get().fetchProfile(data.user.id),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Profile fetch timeout')), 10000))
              ]) as any
              
              if (!profile) {
                console.log('🔵 Profile not found, creating new profile')
                profile = await Promise.race([
                  get().createProfile(
                    data.user.id,
                    data.user.email!,
                    data.user.user_metadata?.first_name,
                    data.user.user_metadata?.last_name,
                    data.user.user_metadata?.phone
                  ),
                  new Promise((_, reject) => setTimeout(() => reject(new Error('Profile creation timeout')), 10000))
                ]) as any
              }
              
              console.log('🟢 Login method complete, final state:', {
                hasUser: !!get().user,
                hasProfile: !!get().profile,
                profileRole: get().profile?.role,
                isAuthenticated: !!get().user && !!get().profile
              })
              
            } catch (profileError) {
              console.error('🔴 Profile operation failed:', profileError)
              // Continue with login even if profile operations fail
              // The middleware and auth compatibility layer will handle this
            }
            
            set({ isLoading: false })
            return { success: true }
          }

          console.error('🔴 Login failed - no user data')
          set({ isLoading: false, error: 'Login failed' })
          return { success: false, error: 'Login failed' }
        } catch (error) {
          console.error('🔴 Login exception:', error)
          set({ isLoading: false, error: error instanceof Error && error.message === 'Login timeout' 
            ? 'Login is taking too long. Please try again.' 
            : 'Network error. Please try again.' })
          return { success: false, error: error instanceof Error && error.message === 'Login timeout'
            ? 'Login is taking too long. Please try again.'
            : 'Network error. Please try again.' }
        }
      },
      
      register: async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
        try {
          console.log('🔵 Starting registration process for:', email)
          set({ isLoading: true, error: null })
          
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

          console.log('🔍 Registration Response Debug:', {
            hasUser: !!authData.user,
            userId: authData.user?.id,
            email: authData.user?.email,
            email_confirmed_at: authData.user?.email_confirmed_at,
            created_at: authData.user?.created_at,
            isEmailConfirmed: !!authData.user?.email_confirmed_at,
            hasSession: !!authData.session,
            sessionAccessToken: authData.session ? 'present' : 'null',
            authError: authError?.message || 'none'
          })

          if (authError) {
            console.error('🔴 Registration auth error:', authError)
            set({ isLoading: false, error: authError.message })
            return { success: false, error: authError.message }
          }

          if (!authData.user) {
            console.error('🔴 Registration failed - no user data')
            set({ isLoading: false, error: 'Registration failed' })
            return { success: false, error: 'Registration failed. Please try again.' }
          }

          // Log the exact user state after registration
          console.log('🔍 User created with details:', {
            id: authData.user.id,
            email: authData.user.email,
            email_confirmed_at: authData.user.email_confirmed_at,
            created_at: authData.user.created_at,
            role: authData.user.role,
            app_metadata: authData.user.app_metadata,
            user_metadata: authData.user.user_metadata,
            identities: authData.user.identities?.length || 0
          })

          // Store user metadata for profile creation after email verification
          console.log('🔵 Storing user metadata for post-verification profile creation')
          const userMetadata = {
            first_name: firstName,
            last_name: lastName,
            phone: phone || '',
            email: email
          }

          // Check if email confirmation is immediately set (indicates disabled confirmation)
          if (authData.user.email_confirmed_at) {
            console.log('🚨 WARNING: email_confirmed_at is SET immediately after registration!')
            console.log('🚨 This suggests Supabase email confirmation is DISABLED in project settings')
            console.log('🚨 User will be auto-authenticated without email verification')
          } else {
            console.log('✅ email_confirmed_at is NULL - email verification required as expected')
          }

          // Don't create profile during registration - wait for email verification
          // Profile will be created in AuthProvider when email is confirmed
          console.log('🔵 Registration complete - user must verify email before profile creation')
          set({ isLoading: false, user: null, profile: null })
          return {
            success: true,
            error: 'Registration successful! Please check your email to verify your account.'
          }
        } catch (error) {
          console.error('🔴 Registration exception:', error)
          set({ isLoading: false, error: 'Network error' })
          return { success: false, error: 'Network error. Please try again.' }
        }
      },
      
      logout: async () => {
        try {
          await supabase.auth.signOut()
          set({ user: null, profile: null, error: null })
          
          // Redirect to homepage after successful logout
          if (typeof window !== 'undefined') {
            window.location.href = '/'
          }
          
          return { success: true }
        } catch (error) {
          console.error('Logout error:', error)
          set({ error: 'Failed to logout' })
          return { success: false, error: 'Failed to logout' }
        }
      },
      
      // Session management
      initializeAuth: async () => {
        try {
          console.log('🔄 Initializing auth state...')
          set({ isLoading: true })
          
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user && session.user.email_confirmed_at) {
            console.log('✅ Found verified user session during init:', session.user.id)
            set({ user: session.user })
            
            try {
              let profile = await get().fetchProfile(session.user.id)
              
              if (!profile && session.user.email) {
                console.log('📝 Creating profile during auth init for verified user')
                profile = await get().createProfile(
                  session.user.id,
                  session.user.email,
                  session.user.user_metadata?.first_name,
                  session.user.user_metadata?.last_name,
                  session.user.user_metadata?.phone
                )
              }
              
              console.log('🔄 Auth initialization complete:', {
                hasUser: !!get().user,
                hasProfile: !!get().profile,
                isAuthenticated: !!get().user && !!get().profile
              })
            } catch (profileError) {
              console.error('❌ Profile operations failed during init:', profileError)
              // Keep user authenticated even if profile operations fail
            }
          } else {
            console.log('❌ No verified user session found during init')
            // Clear state for unverified users
            set({ user: null, profile: null })
          }
          
          set({ isLoading: false })
        } catch (error) {
          console.error('❌ Auth initialization error:', error)
          set({ isLoading: false, error: 'Failed to initialize authentication' })
        }
      },
      
      checkAuthState: async () => {
        try {
          console.log('🔍 Checking current auth state...')
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user && session.user.email_confirmed_at) {
            console.log('✅ Found verified user in auth check:', session.user.id)
            set({ user: session.user })
            await get().fetchProfile(session.user.id)
          } else {
            console.log('❌ No verified user found in auth check')
            set({ user: null, profile: null })
          }
        } catch (error) {
          console.error('❌ Auth state check failed:', error)
          set({ user: null, profile: null })
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => clientOnlyStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        profile: state.profile
      }),
      // Skip hydration to prevent SSR issues
      skipHydration: true
    }
  )
)

// Auth state listener setup (moved to client-side initializer)