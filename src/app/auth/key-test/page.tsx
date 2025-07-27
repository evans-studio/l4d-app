'use client'

import { useState } from 'react'

export default function KeyTestPage() {
  const [result, setResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const testWithFreshKey = async () => {
    setTesting(true)
    
    // Fresh anon key from Supabase dashboard
    const FRESH_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3ZWpiZ2ZpZGRsdGRxd2hmam10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1NTk4MjQsImV4cCI6MjA2OTEzNTgyNH0.stN-oyrkrvL4dH0tHtV3mZgSUwI4qYxsmfAIw0gV4Sk'
    
    try {
      const authUrl = 'https://vwejbgfiddltdqwhfjmt.supabase.co/auth/v1/user'
      const response = await fetch(authUrl, {
        method: 'GET',
        headers: {
          'apikey': FRESH_ANON_KEY,
          'Authorization': `Bearer ${FRESH_ANON_KEY}`
        }
      })
      
      const data = await response.text()
      
      setResult({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        response: data
      })
    } catch (error) {
      setResult({
        success: false,
        error: (error as Error).message
      })
    }
    
    setTesting(false)
  }

  return (
    <div className="min-h-screen bg-surface-primary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Fresh API Key Test</h1>
        
        <div className="mb-6 p-6 bg-amber-600/10 border border-amber-500/20 rounded-lg">
          <h2 className="text-lg font-semibold text-amber-400 mb-2">Instructions:</h2>
          <ol className="text-sm text-text-secondary space-y-1">
            <li>1. Go to Supabase Dashboard → Settings → API</li>
            <li>2. Copy your fresh "anon public" key</li>
            <li>3. Replace PASTE_YOUR_FRESH_ANON_KEY_HERE in the code</li>
            <li>4. Run the test to verify the key works</li>
          </ol>
        </div>

        <div className="mb-6">
          <button
            onClick={testWithFreshKey}
            disabled={testing}
            className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            {testing ? 'Testing Fresh Key...' : 'Test Fresh API Key'}
          </button>
        </div>

        {result && (
          <div className="bg-surface-secondary p-6 rounded-lg border border-border-secondary">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Test Results</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={result.success ? 'text-success-400' : 'text-error-400'}>
                  {result.status} {result.statusText}
                </span>
              </div>
              {result.error && (
                <div className="text-error-400 bg-error-600/10 p-2 rounded">
                  {result.error}
                </div>
              )}
              <div className="mt-4">
                <strong>Response:</strong>
                <pre className="text-xs text-text-muted mt-2 overflow-auto">
                  {result.response}
                </pre>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-6 bg-surface-secondary rounded-lg border border-border-secondary">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Current Environment Keys</h2>
          <div className="text-sm space-y-2">
            <div><strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</div>
            <div><strong>Key Length:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length} chars</div>
            <div><strong>Key Preview:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50)}...</div>
          </div>
        </div>
      </div>
    </div>
  )
}