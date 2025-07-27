'use client'

import { useState } from 'react'

export default function NetworkTestPage() {
  const [results, setResults] = useState<any>({})
  const [testing, setTesting] = useState(false)

  const runNetworkTests = async () => {
    setTesting(true)
    const testResults: any = {}

    // Test 1: Direct Supabase API connectivity
    try {
      const supabaseUrl = 'https://vwejbgfiddltdqwhfjmt.supabase.co'
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZWpiZ2ZpZGRsdGRxd2hmam10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTk4MjQsImV4cCI6MjA2OTEzNTgyNH0.stN-oyrkrvL4dH0tHtV3mZgSUwI4qYxsmfAIw0gV4Sk',
        }
      })
      
      testResults.directAPI = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      }
    } catch (error) {
      testResults.directAPI = {
        success: false,
        error: (error as Error).message
      }
    }

    // Test 2: Supabase Auth endpoint
    try {
      const authUrl = 'https://vwejbgfiddltdqwhfjmt.supabase.co/auth/v1/user'
      const response = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZWpiZ2ZpZGRsdGRxd2hmam10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTk4MjQsImV4cCI6MjA2OTEzNTgyNH0.stN-oyrkrvL4dH0tHtV3mZgSUwI4qYxsmfAIw0gV4Sk',
        }
      })
      
      testResults.authEndpoint = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText
      }
    } catch (error) {
      testResults.authEndpoint = {
        success: false,
        error: (error as Error).message
      }
    }

    // Test 3: Environment availability
    testResults.environment = {
      isVercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      userAgent: navigator.userAgent,
      location: window.location.href
    }

    // Test 4: DNS/Network
    testResults.network = {
      online: navigator.onLine,
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : 'Not available'
    }

    setResults(testResults)
    setTesting(false)
  }

  return (
    <div className="min-h-screen bg-surface-primary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Network & Connectivity Test</h1>
        
        <div className="mb-6">
          <button
            onClick={runNetworkTests}
            disabled={testing}
            className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            {testing ? 'Running Tests...' : 'Run Network Tests'}
          </button>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="space-y-6">
            {/* Direct API Test */}
            <div className="bg-surface-secondary p-6 rounded-lg border border-border-secondary">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Direct Supabase API</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Connection:</span>
                  <span className={results.directAPI?.success ? 'text-success-400' : 'text-error-400'}>
                    {results.directAPI?.success ? '✓ Connected' : '✗ Failed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>{results.directAPI?.status} {results.directAPI?.statusText}</span>
                </div>
                {results.directAPI?.error && (
                  <div className="text-error-400 bg-error-600/10 p-2 rounded">
                    {results.directAPI.error}
                  </div>
                )}
              </div>
            </div>

            {/* Auth Endpoint Test */}
            <div className="bg-surface-secondary p-6 rounded-lg border border-border-secondary">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Supabase Auth Endpoint</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Auth API:</span>
                  <span className={results.authEndpoint?.success ? 'text-success-400' : 'text-error-400'}>
                    {results.authEndpoint?.success ? '✓ Accessible' : '✗ Failed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span>{results.authEndpoint?.status} {results.authEndpoint?.statusText}</span>
                </div>
                {results.authEndpoint?.error && (
                  <div className="text-error-400 bg-error-600/10 p-2 rounded">
                    {results.authEndpoint.error}
                  </div>
                )}
              </div>
            </div>

            {/* Environment Test */}
            <div className="bg-surface-secondary p-6 rounded-lg border border-border-secondary">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Environment & Runtime</h2>
              <div className="space-y-2 text-sm">
                <div><strong>Platform:</strong> {results.environment?.isVercel ? 'Vercel' : 'Local'}</div>
                <div><strong>Environment:</strong> {results.environment?.vercelEnv || results.environment?.nodeEnv}</div>
                <div><strong>Location:</strong> {results.environment?.location}</div>
                <div><strong>Network:</strong> {results.network?.online ? 'Online' : 'Offline'}</div>
              </div>
            </div>

            {/* Raw Results */}
            <div className="bg-surface-secondary p-6 rounded-lg border border-border-secondary">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Complete Test Results</h2>
              <pre className="text-xs text-text-muted overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}