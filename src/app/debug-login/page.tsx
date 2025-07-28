'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/primitives/Button'

export default function DebugLoginPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loginState, setLoginState] = useState<'idle' | 'logging-in' | 'logged-in' | 'error'>('idle')
  const [error, setError] = useState('')

  const checkAuthState = async () => {
    try {
      console.log('=== Checking Auth State ===')
      
      // Check client session
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('Client session:', { session: !!session, error })
      
      // Check server session via API
      const serverResponse = await fetch('/api/debug-auth-flow')
      const serverData = await serverResponse.json()
      console.log('Server session:', serverData)
      
      setDebugInfo({
        client: {
          hasSession: !!session,
          userId: session?.user?.id || null,
          email: session?.user?.email || null,
          error: error?.message || null
        },
        server: serverData
      })
    } catch (err) {
      console.error('Auth check error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const testLogin = async () => {
    setLoginState('logging-in')
    setError('')
    
    try {
      console.log('=== Starting Login Test ===')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'd.dimpauls@gmail.com',
        password: 'test123' // Replace with actual test password
      })
      
      console.log('Login result:', { data: !!data, error })
      
      if (error) {
        setError(error.message)
        setLoginState('error')
      } else if (data.user) {
        setLoginState('logged-in')
        
        // Wait a moment then check auth state
        setTimeout(() => {
          checkAuthState()
        }, 1000)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoginState('error')
    }
  }

  const testDashboardAccess = () => {
    console.log('=== Testing Dashboard Access ===')
    window.location.href = '/dashboard'
  }

  useEffect(() => {
    checkAuthState()
  }, [])

  return (
    <div className="min-h-screen bg-surface-primary p-8 text-text-primary">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
      
      <div className="space-y-6 max-w-2xl">
        {/* Auth State */}
        <div className="bg-surface-secondary p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Current Auth State:</h2>
          <pre className="text-sm bg-surface-primary p-2 rounded overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Login Test */}
        <div className="bg-surface-secondary p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Login Test:</h2>
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">
              State: <span className="font-mono">{loginState}</span>
            </p>
            {error && (
              <p className="text-sm text-red-400">Error: {error}</p>
            )}
            <div className="space-x-2">
              <Button
                onClick={testLogin}
                disabled={loginState === 'logging-in'}
                variant="primary"
              >
                {loginState === 'logging-in' ? 'Logging In...' : 'Test Login'}
              </Button>
              <Button
                onClick={testDashboardAccess}
                variant="secondary"
              >
                Test Dashboard Access
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-surface-secondary p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Actions:</h2>
          <div className="space-x-2">
            <Button onClick={checkAuthState} variant="outline">
              Refresh Auth State
            </Button>
            <Button 
              onClick={async () => {
                await supabase.auth.signOut()
                setLoginState('idle')
                checkAuthState()
              }}
              variant="destructive"
            >
              Sign Out
            </Button>
            <Button 
              onClick={() => window.location.href = '/auth/login'}
              variant="secondary"
            >
              Go to Login Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}