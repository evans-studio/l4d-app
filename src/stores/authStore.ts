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
  
  // Computed getters
  isAuthenticated: boolean
  isAdmin: boolean
  isCustomer: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Auth operations
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>
  logout: () => Promise<void>
  
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
      
      // Computed getters
      get isAuthenticated() {
        const state = get()
        const result = !!state.user && !!state.profile
        console.log('Zustand isAuthenticated getter:', { 
          user: !!state.user, 
          profile: !!state.profile, 
          result 
        })
        return result
      },
      
      get isAdmin() {
        const state = get()
        return state.profile?.role === 'admin' || state.profile?.role === 'super_admin'
      },
      
      get isCustomer() {
        const state = get()
        return state.profile?.role === 'customer'
      },
      
      // State setters
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      // Profile operations
      fetchProfile: async (userId: string) => {
        try {
          console.log('Fetching profile for user:', userId)
          
          // Try RLS bypass function first
          try {
            const { data: functionData, error: functionError } = await supabase
              .rpc('get_user_profile', { user_id: userId })
            
            if (!functionError && functionData && functionData.length > 0) {
              const profile = parseUserProfile(functionData[0])
              if (profile) {
                console.log('Profile fetched via RLS bypass:', profile)
                set({ profile })
                return profile
              }
            }
          } catch (rpcError) {
            console.log('RLS bypass not available, trying direct query')
          }
          
          // Fallback to direct query
          const { data, error } = await supabase
            .from('user_profiles')
            .select('id, email, first_name, last_name, phone, role, is_active, created_at, updated_at')
            .eq('id', userId)
            .eq('is_active', true)
            .single()

          if (error) {
            console.error('Profile fetch error:', error)
            set({ error: `Failed to fetch profile: ${error.message}` })
            return null
          }

          const profile = parseUserProfile(data)
          if (profile) {
            console.log('Profile fetched successfully:', profile)
            set({ profile })
            return profile
          }
          
          set({ error: 'Invalid profile data received' })
          return null
        } catch (error) {
          console.error('Profile fetch exception:', error)
          set({ error: 'Network error while fetching profile' })
          return null
        }
      },
      
      createProfile: async (userId: string, email: string, firstName?: string, lastName?: string, phone?: string) => {
        try {
          const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'customer'
          
          console.log('Creating profile:', { userId, email, firstName, lastName, phone, role })
          
          // Try RLS bypass function first
          try {
            const { data: functionData, error: functionError } = await supabase
              .rpc('create_user_profile', {
                user_id: userId,
                user_email: email.toLowerCase(),
                first_name: firstName || '',
                last_name: lastName || '',
                phone: phone || null,
                user_role: role
              })
            
            if (!functionError && functionData) {
              const profile = parseUserProfile(functionData)
              if (profile) {
                console.log('Profile created via RLS bypass:', profile)
                set({ profile })
                return profile
              }
            }
          } catch (rpcError) {
            console.log('RLS bypass not available, trying direct insert')
          }
          
          // Fallback to direct insert
          const profileData = {
            id: userId,
            email: email.toLowerCase(),
            first_name: firstName || '',
            last_name: lastName || '',
            phone: phone || null,
            role: role,
            is_active: true
          }
          
          const { data, error } = await supabase
            .from('user_profiles')
            .upsert(profileData)
            .select()
            .single()
          
          if (error) {
            console.error('Profile creation error:', error)
            set({ error: `Failed to create profile: ${error.message}` })
            return null
          }
          
          const profile = parseUserProfile(data)
          if (profile) {
            console.log('Profile created successfully:', profile)
            set({ profile })
            return profile
          }
          
          set({ error: 'Invalid profile data received after creation' })
          return null
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
          set({ isLoading: true, error: null })
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          })

          if (error) {
            set({ isLoading: false, error: error.message })
            return { success: false, error: error.message }
          }

          if (data.user) {
            set({ user: data.user })
            
            // Fetch or create profile
            let profile = await get().fetchProfile(data.user.id)
            
            if (!profile) {
              profile = await get().createProfile(
                data.user.id,
                data.user.email!,
                data.user.user_metadata?.first_name,
                data.user.user_metadata?.last_name,
                data.user.user_metadata?.phone
              )
            }
            
            set({ isLoading: false })
            return { success: true }
          }

          set({ isLoading: false, error: 'Login failed' })
          return { success: false, error: 'Login failed' }
        } catch (error) {
          console.error('Login error:', error)
          set({ isLoading: false, error: 'Network error' })
          return { success: false, error: 'Network error. Please try again.' }
        }
      },
      
      register: async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
        try {
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

          if (authError) {
            set({ isLoading: false, error: authError.message })
            return { success: false, error: authError.message }
          }

          if (!authData.user) {
            set({ isLoading: false, error: 'Registration failed' })
            return { success: false, error: 'Registration failed. Please try again.' }
          }

          // Create profile immediately
          const profile = await get().createProfile(
            authData.user.id,
            email,
            firstName,
            lastName,
            phone
          )

          // If email is auto-confirmed, sign in immediately
          if (authData.user.email_confirmed_at && profile) {
            set({ user: authData.user, profile, isLoading: false })
            const redirectTo = profile.role === 'admin' ? '/admin' : '/dashboard'
            return { success: true, redirectTo }
          }

          set({ isLoading: false })
          return {
            success: true,
            error: 'Registration successful! Please check your email to verify your account.'
          }
        } catch (error) {
          console.error('Registration error:', error)
          set({ isLoading: false, error: 'Network error' })
          return { success: false, error: 'Network error. Please try again.' }
        }
      },
      
      logout: async () => {
        try {
          await supabase.auth.signOut()
          set({ user: null, profile: null, error: null })
        } catch (error) {
          console.error('Logout error:', error)
          set({ error: 'Failed to logout' })
        }
      },
      
      // Session management
      initializeAuth: async () => {
        try {
          set({ isLoading: true })
          
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user) {
            set({ user: session.user })
            
            let profile = await get().fetchProfile(session.user.id)
            
            if (!profile && session.user.email) {
              profile = await get().createProfile(
                session.user.id,
                session.user.email,
                session.user.user_metadata?.first_name,
                session.user.user_metadata?.last_name,
                session.user.user_metadata?.phone
              )
            }
          }
          
          set({ isLoading: false })
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ isLoading: false, error: 'Failed to initialize authentication' })
        }
      },
      
      checkAuthState: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          set({ user: session.user })
          await get().fetchProfile(session.user.id)
        } else {
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