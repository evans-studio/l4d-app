'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthTestPage() {
  const [testResults, setTestResults] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const runTests = async () => {
      const results: any = {}
      
      // Test 1: Check if environment variables are available
      results.envVars = {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
        anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      }

      // Test 2: Try to get Supabase session
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        results.session = {
          success: !sessionError,
          error: sessionError?.message || null,
          hasSession: !!sessionData.session
        }
      } catch (error) {
        results.session = {
          success: false,
          error: (error as Error).message,
          hasSession: false
        }
      }

      // Test 3: Try a simple database query
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id')
          .limit(1)
        
        results.database = {
          success: !error,
          error: error?.message || null,
          canQuery: !!data
        }
      } catch (error) {
        results.database = {
          success: false,
          error: (error as Error).message,
          canQuery: false
        }
      }

      setTestResults(results)
      setLoading(false)
    }

    runTests()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Running Auth Tests...</h1>
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-primary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Authentication Diagnostic</h1>
        
        <div className="space-y-6">
          {/* Environment Variables Test */}
          <div className="bg-surface-secondary p-6 rounded-lg border border-border-secondary">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Environment Variables</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Supabase URL:</span>
                <span className={testResults.envVars?.supabaseUrl ? 'text-success-400' : 'text-error-400'}>
                  {testResults.envVars?.supabaseUrl ? '✓ Set' : '✗ Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Anon Key:</span>
                <span className={testResults.envVars?.anonKey ? 'text-success-400' : 'text-error-400'}>
                  {testResults.envVars?.anonKey ? '✓ Set' : '✗ Missing'}
                </span>
              </div>
              <div className="text-text-muted">
                URL: {testResults.envVars?.supabaseUrlValue}
              </div>
              <div className="text-text-muted">
                Key Length: {testResults.envVars?.anonKeyLength} chars
              </div>
            </div>
          </div>

          {/* Session Test */}
          <div className="bg-surface-secondary p-6 rounded-lg border border-border-secondary">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Supabase Session</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Can Get Session:</span>
                <span className={testResults.session?.success ? 'text-success-400' : 'text-error-400'}>
                  {testResults.session?.success ? '✓ Success' : '✗ Failed'}
                </span>
              </div>
              {testResults.session?.error && (
                <div className="text-error-400 bg-error-600/10 p-2 rounded">
                  Error: {testResults.session.error}
                </div>
              )}
            </div>
          </div>

          {/* Database Test */}
          <div className="bg-surface-secondary p-6 rounded-lg border border-border-secondary">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Database Connection</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Can Query Database:</span>
                <span className={testResults.database?.success ? 'text-success-400' : 'text-error-400'}>
                  {testResults.database?.success ? '✓ Success' : '✗ Failed'}
                </span>
              </div>
              {testResults.database?.error && (
                <div className="text-error-400 bg-error-600/10 p-2 rounded">
                  Error: {testResults.database.error}
                </div>
              )}
            </div>
          </div>

          {/* Raw Data */}
          <div className="bg-surface-secondary p-6 rounded-lg border border-border-secondary">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Raw Test Data</h2>
            <pre className="text-xs text-text-muted overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}