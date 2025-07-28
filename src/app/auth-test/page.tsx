'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthTestPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('=== AUTH TEST PAGE ===')
        
        // Check session
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Session check result:', { session, error })
        
        setSessionInfo({
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          email: session?.user?.email,
          error: error?.message
        })

        // If we have a user, get profile
        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          console.log('Profile check result:', { profileData, profileError })
          setProfile(profileData)
        }
      } catch (error) {
        console.error('Auth test error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary p-8">
        <h1 className="text-2xl font-bold mb-4">Auth Test - Loading...</h1>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-primary p-8 text-text-primary">
      <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="space-y-6">
        <div className="bg-surface-secondary p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Session Info:</h2>
          <pre className="text-sm bg-surface-primary p-2 rounded overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-surface-secondary p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Profile Info:</h2>
          <pre className="text-sm bg-surface-primary p-2 rounded overflow-auto">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => window.location.href = '/auth/login'}
            className="bg-blue-600 text-white px-4 py-2 rounded mr-2"
          >
            Go to Login
          </button>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="bg-green-600 text-white px-4 py-2 rounded mr-2"
          >
            Go to Dashboard
          </button>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.reload()
            }}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}