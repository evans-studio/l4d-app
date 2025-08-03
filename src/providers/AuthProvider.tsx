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
        console.log('🔄 Auth state change event:', event, 'Has session user:', !!session?.user, 'Session user ID:', session?.user?.id)
        
        const store = useStore.getState()
        
        if (session?.user) {
          console.log('🔍 Auth Debug - Full User Session Details:', {
            event: event,
            userId: session.user.id,
            email: session.user.email,
            email_confirmed_at: session.user.email_confirmed_at,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at,
            isEmailConfirmed: !!session.user.email_confirmed_at,
            role: session.user.role,
            app_metadata: session.user.app_metadata,
            user_metadata: session.user.user_metadata,
            identities: session.user.identities?.map(i => ({ provider: i.provider, identity_id: i.identity_id })),
            sessionExpiresAt: session.expires_at,
            accessToken: session.access_token ? 'present' : 'null'
          })
          
          // Log specific scenarios
          if (event === 'SIGNED_IN') {
            console.log('🆕 SIGNED_IN event detected - user signed in')
            if (session.user.email_confirmed_at) {
              console.log('✅ email_confirmed_at is SET - email is verified')
            } else {
              console.log('⚠️ email_confirmed_at is NULL - email verification may be required')
            }
          }
          
          if (event === 'SIGNED_IN') {
            console.log('🔑 SIGNED_IN event detected - user logging in or session restored')
          }
          
          if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 TOKEN_REFRESHED event detected - session token updated')
          }
          
          // Only authenticate users with verified emails
          if (session.user.email_confirmed_at) {
            console.log('✅ Email confirmed, setting verified user in store:', session.user.id, session.user.email)
            store.setUser(session.user)
            
            try {
              console.log('🔍 Fetching profile for verified user:', session.user.id)
              let profile = await store.fetchProfile(session.user.id)
              
              if (!profile && session.user.email) {
                console.log('📝 Profile not found, creating new profile for verified user')
                console.log('📝 Using metadata:', {
                  email: session.user.email,
                  firstName: session.user.user_metadata?.first_name,
                  lastName: session.user.user_metadata?.last_name,
                  phone: session.user.user_metadata?.phone
                })
                
                profile = await store.createProfile(
                  session.user.id,
                  session.user.email,
                  session.user.user_metadata?.first_name,
                  session.user.user_metadata?.last_name,
                  session.user.user_metadata?.phone
                )
                
                if (profile) {
                  console.log('✅ Profile created successfully for verified user:', profile.id)
                } else {
                  console.error('❌ Profile creation failed for verified user')
                }
              } else if (profile) {
                console.log('✅ Existing profile found for verified user:', profile.id)
              }
              
              const finalState = useStore.getState()
              console.log('Final auth state after listener:', {
                hasUser: !!finalState.user,
                hasProfile: !!finalState.profile,
                isAuthenticated: !!finalState.user && !!finalState.profile,
                profileRole: finalState.profile?.role
              })
            } catch (profileError) {
              console.error('❌ Profile operations failed for verified user:', profileError)
              // Don't clear user state if profile operations fail
              // User is still authenticated, profile can be retried later
            }
          } else {
            console.log('❌ Email NOT confirmed, clearing auth state. User needs to verify email.')
            console.log('❌ Event:', event, 'User created at:', session.user.created_at)
            store.setUser(null)
            store.setProfile(null)
          }
        } else {
          console.log('No session, clearing auth state. Event:', event)
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