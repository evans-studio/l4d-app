'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'

export default function LoginTestPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testClientLogin = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('=== Client-side login test ===')
      const startTime = Date.now()
      
      // Import supabase dynamically to check for issues
      const { supabase } = await import('@/lib/supabase')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'paul@evans-studio.co.uk',
        password: 'TestPass123!'
      })
      
      const duration = Date.now() - startTime
      console.log('Client login took:', duration + 'ms')
      
      setResult({
        type: 'client',
        success: !error,
        error: error?.message,
        userId: data.user?.id,
        email: data.user?.email,
        duration
      })
    } catch (error) {
      console.error('Client test error:', error)
      setResult({
        type: 'client',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const testServerLogin = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('=== Server-side login test ===')
      const startTime = Date.now()
      
      const response = await fetch('/api/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'paul@evans-studio.co.uk',
          password: 'TestPass123!'
        })
      })
      
      const data = await response.json()
      const duration = Date.now() - startTime
      
      console.log('Server test took:', duration + 'ms')
      console.log('Server response:', data)
      
      setResult({
        type: 'server',
        ...data,
        totalDuration: duration
      })
    } catch (error) {
      console.error('Server test error:', error)
      setResult({
        type: 'server',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-primary p-8 text-text-primary">
      <h1 className="text-2xl font-bold mb-6">Login Timeout Debug</h1>
      
      <div className="space-y-4 max-w-2xl">
        <div className="bg-surface-secondary p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Test Login Methods:</h2>
          <div className="space-x-2">
            <Button 
              onClick={testClientLogin}
              disabled={loading}
              variant="primary"
            >
              {loading ? 'Testing...' : 'Test Client-Side Login'}
            </Button>
            <Button 
              onClick={testServerLogin}
              disabled={loading}
              variant="secondary"
            >
              {loading ? 'Testing...' : 'Test Server-Side Login'}
            </Button>
          </div>
        </div>

        {result && (
          <div className="bg-surface-secondary p-4 rounded border">
            <h2 className="text-lg font-semibold mb-2">Test Result ({result.type}):</h2>
            <pre className="text-sm bg-surface-primary p-2 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-surface-secondary p-4 rounded border">
          <h2 className="text-lg font-semibold mb-2">Credentials:</h2>
          <p className="text-sm">Email: paul@evans-studio.co.uk</p>
          <p className="text-sm">Password: TestPass123!</p>
        </div>
      </div>
    </div>
  )
}