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
        console.log('Auth state change:', event, !!session?.user)
        
        const store = useStore.getState()
        
        if (session?.user) {
          store.setUser(session.user)
          
          let profile = await store.fetchProfile(session.user.id)
          
          if (!profile && session.user.email) {
            profile = await store.createProfile(
              session.user.id,
              session.user.email,
              session.user.user_metadata?.first_name,
              session.user.user_metadata?.last_name,
              session.user.user_metadata?.phone
            )
          }
        } else {
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
  return useStore((state) => ({
    user: state.user,
    profile: state.profile,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    isAdmin: state.isAdmin,
    isCustomer: state.isCustomer,
    error: state.error,
    login: state.login,
    register: state.register,
    logout: state.logout,
    refreshProfile: state.refreshProfile,
  }))
}