'use client'

import { useEffect } from 'react'
import { useAuthStore as useStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase/client'

export function ZustandAuthInitializer({ children }: { children: React.ReactNode }) {
  const initializeAuth = useStore((state) => state.initializeAuth)
  
  useEffect(() => {
    let subscription: any = null
    
    // Wait for hydration to complete
    const initAuth = async () => {
      // Ensure store is hydrated
      await useStore.persist.rehydrate()
      
      // Set up auth state listener on client side only after hydration
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event, !!session?.user, 'Session user ID:', session?.user?.id)
        
        const store = useStore.getState()
        
        if (session?.user) {
          console.log('Setting user in store:', session.user.id, session.user.email)
          store.setUser(session.user)
          
          let profile = await store.fetchProfile(session.user.id)
          
          if (!profile && session.user.email) {
            console.log('Profile not found, creating new profile')
            profile = await store.createProfile(
              session.user.id,
              session.user.email,
              session.user.user_metadata?.first_name,
              session.user.user_metadata?.last_name,
              session.user.user_metadata?.phone
            )
          }
          
          const finalState = useStore.getState()
          console.log('Final auth state after listener:', {
            hasUser: !!finalState.user,
            hasProfile: !!finalState.profile,
            isAuthenticated: !!finalState.user && !!finalState.profile
          })
          
        } else {
          console.log('No session, clearing auth state')
          store.setUser(null)
          store.setProfile(null)
        }
        
        store.setLoading(false)
      })
      
      subscription = data.subscription
      
      // Initialize auth on app start after hydration
      await initializeAuth()
    }
    
    // Start initialization on next tick to ensure hydration is complete
    setTimeout(initAuth, 0)
    
    // Cleanup subscription
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [initializeAuth])

  return <>{children}</>
}

// New hook for components migrated to Zustand
export function useAuth() {
  const user = useStore((state) => state.user)
  const profile = useStore((state) => state.profile)
  const isLoading = useStore((state) => state.isLoading)
  const error = useStore((state) => state.error)
  const login = useStore((state) => state.login)
  const register = useStore((state) => state.register)
  const logout = useStore((state) => state.logout)
  const refreshProfile = useStore((state) => state.refreshProfile)

  // Compute auth state directly instead of relying on getters
  const isAuthenticated = !!user && !!profile
  const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin'
  const isCustomer = profile?.role === 'customer'

  return {
    user,
    profile,
    isLoading,
    isAuthenticated,
    isAdmin,
    isCustomer,
    error,
    login,
    register,
    logout,
    refreshProfile,
  }
}