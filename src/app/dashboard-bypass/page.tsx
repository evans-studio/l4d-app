'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function DashboardBypassPage() {
  const [authData, setAuthData] = useState<any>({})
  const [dashboardData, setDashboardData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const testAuth = async () => {
      try {
        console.log('=== DASHBOARD BYPASS TEST ===')
        
        // Test 1: Get session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session test:', { hasSession: !!session, error: sessionError?.message })
        
        // Test 2: Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('User test:', { hasUser: !!user, error: userError?.message })
        
        // Test 3: Get profile if user exists
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
          console.log('Profile test:', { hasProfile: !!profile, error: profileError?.message })
        }
        
        setAuthData({
          session: !!session,
          sessionError: sessionError?.message,
          user: !!user,
          userError: userError?.message,
          userEmail: user?.email,
          profile: !!profile,
          profileError: profileError?.message,
          profileRole: profile?.role,
          profileActive: profile?.is_active
        })
        
        // Test 4: Try API call
        if (user) {
          try {
            const response = await fetch('/api/customer/bookings')
            const result = await response.json()
            console.log('API test:', { status: response.status, success: result.success })
            setDashboardData({ 
              apiWorking: response.ok,
              apiError: response.ok ? null : result.error?.message,
              bookings: result.data?.length || 0
            })
          } catch (error) {
            console.log('API test failed:', error)
            setDashboardData({ apiWorking: false, apiError: 'Fetch failed' })
          }
        }
        
      } catch (error) {
        console.error('Bypass test error:', error)
        setAuthData({ error: 'Test failed' })
      } finally {
        setLoading(false)
      }
    }
    
    testAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-text-primary mb-6">Dashboard Bypass Test</h1>
          <div className="bg-surface-secondary rounded-lg p-6">
            <p>Running authentication tests...</p>
          </div>
        </div>
      </div>
    )
  }

  const allGood = authData.session && authData.user && authData.profile && authData.profileActive

  return (
    <div className="min-h-screen bg-surface-primary p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-text-primary">Dashboard Bypass Test</h1>
        
        <div className="bg-surface-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <pre className="text-sm text-text-secondary overflow-auto bg-surface-primary p-4 rounded">
            {JSON.stringify(authData, null, 2)}
          </pre>
        </div>
        
        <div className="bg-surface-secondary rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">API Test Results</h2>
          <pre className="text-sm text-text-secondary overflow-auto bg-surface-primary p-4 rounded">
            {JSON.stringify(dashboardData, null, 2)}
          </pre>
        </div>
        
        {allGood ? (
          <div className="bg-success-600/10 border border-success-500/20 rounded-md p-4">
            <p className="text-success-400">✅ Everything looks good! The dashboard should work.</p>
            <div className="mt-4 space-y-2">
              <a 
                href="/dashboard" 
                className="block bg-brand-600 text-white px-4 py-2 rounded-md text-center hover:bg-brand-700"
              >
                Try Real Dashboard
              </a>
              <a 
                href="/dashboard/vehicles" 
                className="block bg-gray-600 text-white px-4 py-2 rounded-md text-center hover:bg-gray-700"
              >
                Try Vehicles Page
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-error-600/10 border border-error-500/20 rounded-md p-4">
            <p className="text-error-400">❌ Issues detected. Check the logs above.</p>
            <a 
              href="/auth/login" 
              className="block mt-4 bg-brand-600 text-white px-4 py-2 rounded-md text-center hover:bg-brand-700"
            >
              Go to Login
            </a>
          </div>
        )}
      </div>
    </div>
  )
}