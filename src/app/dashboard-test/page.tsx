'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function DashboardTestPage() {
  const [authStatus, setAuthStatus] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // Check user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        // Check profile if user exists
        let profile = null
        let profileError = null
        if (user) {
          const profileResult = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          profile = profileResult.data
          profileError = profileResult.error
        }

        setAuthStatus({
          hasSession: !!session,
          sessionError: sessionError?.message,
          hasUser: !!user,
          userError: userError?.message,
          userEmail: user?.email,
          hasProfile: !!profile,
          profileError: profileError?.message,
          profileRole: profile?.role,
          profileActive: profile?.is_active
        })
      } catch (error) {
        setAuthStatus({ error: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  if (loading) {
    return <div className="p-8">Loading auth status...</div>
  }

  return (
    <div className="min-h-screen bg-surface-primary p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-6">
          Dashboard Authentication Test
        </h1>
        
        <div className="bg-surface-secondary rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <pre className="text-sm text-text-secondary overflow-auto">
            {JSON.stringify(authStatus, null, 2)}
          </pre>
        </div>
        
        {authStatus.hasUser && authStatus.hasProfile && authStatus.profileActive ? (
          <div className="bg-success-600/10 border border-success-500/20 rounded-md p-4 mb-4">
            <p className="text-success-400">✅ Authentication looks good! You should be able to access the dashboard.</p>
          </div>
        ) : (
          <div className="bg-error-600/10 border border-error-500/20 rounded-md p-4 mb-4">
            <p className="text-error-400">❌ Authentication issues detected.</p>
          </div>
        )}
        
        <div className="space-y-3">
          <a 
            href="/dashboard" 
            className="block bg-brand-600 text-white px-4 py-2 rounded-md text-center hover:bg-brand-700"
          >
            Try Dashboard (Direct Link)
          </a>
          
          <a 
            href="/auth/login" 
            className="block bg-gray-600 text-white px-4 py-2 rounded-md text-center hover:bg-gray-700"
          >
            Back to Login
          </a>
        </div>
      </div>
    </div>
  )
}